import contextlib
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
COLLECTIONS = {"staff", "storefronts", "staff_settings", "carriers", "ports", "routes", "route_margins",
               "rate_series", "rate_versions", "rate_costs", "schedules", "rate_schedules", "search_daily_stats", "import_jobs",
               "workspace_events", "workspace_notes", "saved_quotes"}


class Backend:
    def __init__(self, directory):
        self.directory = directory
        self.binary = ROOT / "bin" / ("pocketbase.exe" if os.name == "nt" else "pocketbase")
        self.flags = [f"--dir={directory / 'data'}", f"--migrationsDir={ROOT / 'pb_migrations'}",
                      f"--hooksDir={ROOT / 'pb_hooks'}", "--automigrate=false"]
        self.password = secrets.token_urlsafe(30)
        self.email = "root@example.test"
        self.token = None
        self.process = None
        self.log = (directory / "server.log").open("w", encoding="utf-8")
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            self.port = listener.getsockname()[1]

    def cli(self, *arguments, input_text=None):
        result = subprocess.run([str(self.binary), *arguments, *self.flags], input=input_text,
                                text=True, capture_output=True, timeout=45)
        assert result.returncode == 0, f"Command failed: {arguments[0]}\n{result.stderr}"
        return result.stdout

    def api(self, path, body=None, token=None, expected=200, method=None):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = token
        request = urllib.request.Request(f"http://127.0.0.1:{self.port}" + path,
            data=None if body is None else json.dumps(body).encode(), headers=headers, method=method)
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        try:
            response = opener.open(request, timeout=10)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            raw = response.read()
            value = json.loads(raw) if raw else None
            status = response.code
        acceptable = expected if isinstance(expected, tuple) else (expected,)
        assert status in acceptable, f"{method or ('POST' if body is not None else 'GET')} {path}: expected {expected}, got {status}: {value}"
        return value

    def create(self, collection, body, token=None, expected=200):
        return self.api(f"/api/collections/{collection}/records", body, token or self.token, expected)

    def update(self, collection, id, body, token=None, expected=200):
        return self.api(f"/api/collections/{collection}/records/{id}", body, token or self.token, expected, "PATCH")

    def records(self, collection, token=None, query=""):
        return self.api(f"/api/collections/{collection}/records?perPage=100{query}", token=token)["items"]

    def auth(self, email, password=None, collection="staff", expected=200):
        return self.api(f"/api/collections/{collection}/auth-with-password",
                        {"identity": email, "password": password or self.password}, expected=expected)

    def start(self):
        self.process = subprocess.Popen([str(self.binary), "serve", f"--http=127.0.0.1:{self.port}", *self.flags],
                                        stdout=self.log, stderr=self.log, env={**os.environ, "PB_PYTHON": sys.executable})
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            assert self.process.poll() is None, "Server exited; check hooks"
            try:
                self.api("/api/health")
                self.token = self.auth(self.email, collection="_superusers")["token"]
                return
            except (OSError, urllib.error.URLError):
                time.sleep(0.1)
        raise AssertionError("Server startup timeout")

    def stop(self):
        if self.process and self.process.poll() is None:
            self.process.terminate()
            self.process.wait(timeout=10)

    def rollback_and_reapply(self):
        self.stop()
        assert self.cli("migrate", "down", "8", input_text="y\n").count("Reverted") == 8
        self.cli("migrate", "up")
        self.cli("migrate", "up")
        self.start()
        schema = self.api("/api/collections?perPage=100", token=self.token)["items"]
        assert COLLECTIONS.issubset({record["name"] for record in schema})
        assert not self.records("staff", self.token)
        print("PASS: rollback/reapply all 8 migrations and restart")


@contextlib.contextmanager
def instance():
    test_root = ROOT / ".test-data"
    test_root.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="integration-", dir=test_root) as temporary:
        directory = Path(temporary).resolve()
        assert directory.is_relative_to(test_root.resolve())
        backend = Backend(directory)
        try:
            backend.cli("migrate", "up")
            backend.cli("migrate", "up")
            backend.cli("superuser", "create", backend.email, backend.password)
            backend.start()
            print("PASS: clean initialization, idempotent migrations and HTTP startup")
            yield backend
        except BaseException:
            backend.stop()
            backend.log.flush()
            print((directory / "server.log").read_text(encoding="utf-8")[-6000:].encode("ascii", "backslashreplace").decode())
            raise
        finally:
            backend.stop()
            backend.log.close()
