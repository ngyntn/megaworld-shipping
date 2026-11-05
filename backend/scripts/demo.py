"""Create/serve sample data in backend/demo_data, never in the application database."""
import json
import os
from pathlib import Path
import secrets
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else "setup"
    if action not in {"setup", "serve"}:
        raise SystemExit("Usage: python backend/scripts/demo.py [setup|serve]")
    binary = ROOT / "bin" / ("pocketbase.exe" if os.name == "nt" else "pocketbase")
    flags = [f"--dir={ROOT / 'demo_data'}", f"--migrationsDir={ROOT / 'pb_migrations'}",
             f"--hooksDir={ROOT / 'pb_hooks'}", "--automigrate=false"]
    environment = {**os.environ, "PB_DEMO_MODE": "true", "PB_PYTHON": sys.executable}
    credentials = ROOT / ".demo-credentials.json"
    if action == "serve":
        raise SystemExit(subprocess.call([str(binary), "serve", "--http=127.0.0.1:8091", *flags], env=environment))
    if credentials.exists():
        password = json.loads(credentials.read_text())["password"]
    else:
        if (ROOT / "demo_data" / "data.db").exists():
            raise SystemExit("Demo database exists but its credential file is missing; recover/reset that demo account before rerunning setup.")
        password = secrets.token_urlsafe(24)
    environment["PB_DEMO_PASSWORD"] = password
    subprocess.run([str(binary), "migrate", "up", *flags], env=environment, check=True)
    subprocess.run([str(binary), "megaworld-demo", *flags], env=environment, check=True)
    if not credentials.exists():
        descriptor = os.open(credentials, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "w", encoding="utf-8") as output:
            json.dump({"email": "demo@example.test", "password": password, "slug": "megaworld-demo",
                       "url": "http://127.0.0.1:8091"}, output, indent=2)
    print(f"Demo credentials saved locally: {credentials}")
    print("Run: python backend/scripts/demo.py serve")


if __name__ == "__main__":
    main()
