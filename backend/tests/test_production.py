import os
import socket
import subprocess
import sys
import time
import json
import urllib.request
from container import environment


def check_production(b):
    secret = b.directory / "deployment-key"
    secret.write_text("a" * 32)
    values = {**os.environ, "PB_ENV": "production", "PB_PUBLIC_URL": "https://api.shipping.test",
              "PB_ORIGINS": "https://app.shipping.test", "PB_ENCRYPTION_KEY_FILE": str(secret),
              "PB_ENCRYPTION_KEY": "a" * 32, "PB_PYTHON": sys.executable}
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    directory = b.directory / "production-data"
    flags = [flag for flag in b.flags if not flag.startswith("--dir=")] + [f"--dir={directory}", "--encryptionEnv=PB_ENCRYPTION_KEY"]
    migrated = subprocess.run([str(b.binary), "migrate", "up", *flags], env=values, capture_output=True, text=True, timeout=30)
    assert migrated.returncode == 0, migrated.stderr
    created = subprocess.run([str(b.binary), "superuser", "create", b.email, b.password, *flags], env=values, capture_output=True, text=True, timeout=15)
    assert created.returncode == 0, created.stderr
    process = subprocess.Popen([str(b.binary), "serve", f"--http=127.0.0.1:{port}", "--origins=https://app.shipping.test", *flags],
                               env=values, stdout=b.log, stderr=b.log)
    original = b.port
    try:
        b.port = port
        deadline = time.monotonic() + 15
        while True:
            try:
                b.api("/api/health")
                break
            except (OSError, urllib.error.URLError):
                assert time.monotonic() < deadline and process.poll() is None
                time.sleep(0.1)
        token = b.auth(b.email, collection="_superusers")["token"]
        settings = b.api("/api/settings", token=token)
        assert settings["rateLimits"]["enabled"]
        assert settings["backups"]["cron"] == "0 19 * * *" and settings["backups"]["cronMaxKeep"] == 7
        assert not settings["logs"]["logIP"]
        assert settings["trustedProxy"]["headers"] == ["X-Real-IP"]
        for origin, allowed in [("https://app.shipping.test", True), ("https://other.shipping.test", False)]:
            request = urllib.request.Request(f"http://127.0.0.1:{port}/api/health", method="OPTIONS",
                headers={"Origin": origin, "Access-Control-Request-Method": "GET"})
            with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(request, timeout=5) as response:
                assert (response.headers.get("Access-Control-Allow-Origin") == origin) is allowed
        denied = [b.api("/api/collections/staff/auth-with-password", method="POST", expected=(400, 429)) for _ in range(11)]
        assert any(response.get("status") == 429 for response in denied)
        b.api("/api/backups", {"name": "encrypted-test.zip"}, token, 204)
        assert (directory / "backups" / "encrypted-test.zip").exists()
    finally:
        process.terminate(); process.wait(timeout=10)
        b.port = original
    # Configuration validation can run without Docker and must never print a key.
    previous = os.environ.copy()
    try:
        os.environ.update(values)
        assert environment()["PB_ENCRYPTION_KEY"] == "a" * 32
        os.environ["PB_ORIGINS"] = "*"
        try:
            environment()
            raise AssertionError("Wildcard production origin was accepted")
        except ValueError:
            pass
    finally:
        os.environ.clear(); os.environ.update(previous)
    print("PASS: encrypted production startup, CORS configuration, rate limits and daily backup settings")
