"""Install the pinned official PocketBase binary, verifying its archive hash."""
import hashlib
import io
import json
import os
from pathlib import Path
import platform
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    lock = json.loads((ROOT / "pocketbase.lock.json").read_text())
    system = platform.system().lower()
    machine = platform.machine().lower()
    arch = {"amd64": "amd64", "x86_64": "amd64", "arm64": "arm64", "aarch64": "arm64"}.get(machine)
    target = f"{system}_{arch}"
    expected = lock["sha256"].get(target)
    if not expected:
        raise SystemExit(f"Unsupported platform: {system}/{machine}")
    asset = f"pocketbase_{lock['version']}_{target}.zip"
    url = f"https://github.com/pocketbase/pocketbase/releases/download/v{lock['version']}/{asset}"
    print(f"Downloading {asset}...", flush=True)
    with urllib.request.urlopen(url, timeout=60) as response:
        archive = response.read()
    if hashlib.sha256(archive).hexdigest() != expected:
        raise SystemExit("SHA256 mismatch; no executable was installed.")
    name = "pocketbase.exe" if system == "windows" else "pocketbase"
    destination = ROOT / "bin" / name
    destination.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(archive)) as bundle:
        executable = bundle.read(name)
    temporary = destination.with_suffix(".download")
    temporary.write_bytes(executable)
    os.chmod(temporary, 0o755)
    temporary.replace(destination)
    print(f"Installed PocketBase {lock['version']}: {destination}")


if __name__ == "__main__":
    main()
