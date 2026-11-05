"""Container entrypoint: validate deployment settings and load the encryption secret."""
import getpass
import os
from pathlib import Path
import subprocess
import sys
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]


def environment():
    values = os.environ.copy()
    secret = Path(values.get("PB_ENCRYPTION_KEY_FILE", "/run/secrets/pb_encryption_key"))
    key = secret.read_text().strip()
    if len(key) != 32 or not key.isascii():
        raise ValueError("Encryption key must contain exactly 32 ASCII characters.")
    values["PB_ENCRYPTION_KEY"] = key
    values["PB_PYTHON"] = sys.executable
    values["PB_ENV"] = "production"
    public = values.get("PB_PUBLIC_URL", "")
    origins = values.get("PB_ORIGINS", "").split(",")
    for url in [public, *origins]:
        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.path not in {"", "/"} or parsed.query or parsed.fragment or parsed.hostname.endswith("example.com"):
            raise ValueError("Set real HTTPS PB_PUBLIC_URL/PB_ORIGINS before deployment.")
    return values


def main():
    values = environment()
    binary = ROOT / "bin" / "pocketbase"
    flags = ["--dir=/data", f"--migrationsDir={ROOT / 'pb_migrations'}", f"--hooksDir={ROOT / 'pb_hooks'}",
             "--automigrate=false", "--encryptionEnv=PB_ENCRYPTION_KEY"]
    arguments = sys.argv[1:] or ["serve"]
    if arguments == ["create-admin"]:
        email = input("Superuser email: ").strip()
        password = getpass.getpass("Superuser password (min 16 characters): ")
        if len(password) < 16 or password != getpass.getpass("Repeat password: "):
            raise ValueError("Password must match and contain at least 16 characters.")
        result = subprocess.run([str(binary), "superuser", "create", email, password, *flags], env=values)
        raise SystemExit(result.returncode)
    if arguments[0] == "serve":
        arguments += ["--http=0.0.0.0:8090", "--origins=" + values["PB_ORIGINS"]]
    os.execve(binary, [str(binary), *arguments, *flags], values)


if __name__ == "__main__":
    main()
