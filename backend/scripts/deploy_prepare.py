"""Create an untracked local deployment key; never overwrite an existing key."""
import os
from pathlib import Path
import secrets


if __name__ == "__main__":
    directory = Path(__file__).resolve().parents[1] / "deploy" / "secrets"
    directory.mkdir(exist_ok=True, mode=0o700)
    target = directory / "pb_encryption_key"
    if target.exists():
        print("Existing deployment key kept.")
    else:
        # The private directory is 0700; the bind-mounted secret must also be readable
        # by container UID 10001 (Compose file secrets may preserve host file mode).
        descriptor = os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o644)
        with os.fdopen(descriptor, "w", encoding="ascii") as output:
            output.write(secrets.token_hex(16))
        os.chmod(target, 0o644)
        print("Created local deployment encryption key; store a separate protected copy.")
