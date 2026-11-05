from pathlib import Path
from contextlib import closing
import sqlite3
import zipfile
from restore import restore


def check_restore(b):
    b.api("/api/backups", {"name": "release-test.zip"}, b.token, 204)
    archive = b.directory / "data" / "backups" / "release-test.zip"
    assert archive.exists()
    before_prices = b.records("rate_versions", b.token)
    before_staff = b.records("staff", b.token)
    target = b.directory / "restored"
    restore(archive, target)
    assert any((target / "storage").rglob("*.png")), "Backup lost uploaded logos"
    with closing(sqlite3.connect(target / "data.db")) as database:
        assert database.execute("SELECT COUNT(*) FROM rate_versions").fetchone()[0] == len(before_prices)
    try:
        restore(archive, target)
        raise AssertionError("Restore overwrote an existing directory")
    except ValueError:
        pass
    unsafe = b.directory / "unsafe.zip"
    with zipfile.ZipFile(unsafe, "w") as output:
        output.writestr("../escape", "invalid")
        output.writestr("data.db", "invalid")
    try:
        restore(unsafe, b.directory / "unsafe-restore")
        raise AssertionError("Traversal archive was accepted")
    except ValueError:
        pass
    assert not (b.directory / "escape").exists()

    # Boot the restored data with the exact same release, authenticate and exercise real APIs.
    b.stop()
    original_flags = list(b.flags)
    try:
        b.flags = [flag for flag in b.flags if not flag.startswith("--dir=")] + [f"--dir={target}"]
        b.start()
        assert b.records("rate_versions", b.token) == before_prices
        assert b.records("staff", b.token) == before_staff
        assert b.records("rate_costs") == []
        public = b.api("/api/megaworld/storefronts/carol/rates")["items"]
        assert public and "cost_price_cents" not in public[0]
    finally:
        b.stop()
        b.flags = original_flags
        b.start()
    print("PASS: live backup, database/files restore, protected target, malicious archive rejection and restored HTTP APIs")
