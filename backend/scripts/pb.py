"""Run the pinned PocketBase with explicit project paths from any directory."""
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    environment = os.environ.copy()
    config = ROOT / ".env"
    if config.exists():
        for line in config.read_text(encoding="utf-8-sig").splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                key, value = line.split("=", 1)
                environment.setdefault(key.strip(), value.strip().strip("\"'"))
    binary = ROOT / "bin" / ("pocketbase.exe" if os.name == "nt" else "pocketbase")
    environment.setdefault("PB_PYTHON", sys.executable)
    if not binary.exists():
        raise SystemExit("Run: python backend/scripts/install.py")
    expected = json.loads((ROOT / "pocketbase.lock.json").read_text())["version"]
    actual = subprocess.check_output([str(binary), "--version"], text=True).strip()
    if actual not in (f"pocketbase version {expected}", f"pocketbase.exe version {expected}"):
        raise SystemExit(f"Expected PocketBase {expected}, got {actual}; run install.py again.")
    arguments = sys.argv[1:] or ["serve"]
    if arguments[0] == "serve":
        arguments += [f"--http={environment.get('PB_HTTP', '127.0.0.1:8090')}"]
    arguments += [f"--dir={ROOT / 'pb_data'}", f"--migrationsDir={ROOT / 'pb_migrations'}",
                  f"--hooksDir={ROOT / 'pb_hooks'}", "--automigrate=false"]
    raise SystemExit(subprocess.call([str(binary), *arguments], cwd=ROOT, env=environment))


if __name__ == "__main__":
    main()
