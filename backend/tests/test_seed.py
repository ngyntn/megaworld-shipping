import json
from contextlib import closing
import os
from pathlib import Path
import sqlite3
import subprocess
from test_access import make_staff


def check_seed(b):
    first, second = make_staff(b, "seed-one"), make_staff(b, "seed-two")
    endpoint = "/api/megaworld/admin/setup/catalog"
    b.api(endpoint, expected=401, method="POST")
    b.api(endpoint, {"owner": second["staff"]["id"]}, first["token"], 400)
    seeded = b.api(endpoint, {}, first["token"])
    assert seeded["carriers"]["created"] == 15 and seeded["ports"]["created"] == 79
    carriers = b.records("carriers", first["token"])
    assert len(carriers) == 16 and all(row["logo"] for row in carriers if row["code"] != "TEST")
    one = next(row for row in carriers if row["code"] == "ONE")
    b.update("carriers", one["id"], {"name": "User edited name"}, first["token"])
    again = b.api(endpoint, {}, first["token"])
    assert again["carriers"]["created"] == 0 and again["ports"]["skipped"] == 79
    assert b.api(f"/api/collections/carriers/records/{one['id']}", token=first["token"])["name"] == "User edited name"
    b.api(endpoint, {}, second["token"])
    theirs = b.records("carriers", second["token"])
    assert not set(row["id"] for row in carriers).intersection(row["id"] for row in theirs)
    ports = b.records("ports", first["token"])
    assert sum(row["can_be_pol"] for row in ports) == 7  # fixture POL plus six seeded origins
    assert next(row for row in ports if row["code"] == "CAI_MEP")["unlocode"] == "VNTOT"

    # Demo CLI is isolated and idempotent; plaintext credentials are never persisted by the CLI.
    directory = b.directory / "demo_data"
    flags = [item for item in b.flags if not item.startswith("--dir=")] + [f"--dir={directory}"]
    environment = {**os.environ, "PB_DEMO_MODE": "true", "PB_DEMO_PASSWORD": b.password}
    for args in [("migrate", "up"), ("megaworld-demo",), ("megaworld-demo",)]:
        result = subprocess.run([str(b.binary), *args, *flags], env=environment, capture_output=True, text=True, timeout=30)
        assert result.returncode == 0, result.stderr
    with closing(sqlite3.connect(directory / "data.db")) as database:
        assert database.execute("SELECT COUNT(*) FROM staff").fetchone()[0] == 1
        assert database.execute("SELECT COUNT(*) FROM ports").fetchone()[0] == 79
        assert database.execute("SELECT COUNT(*) FROM carriers").fetchone()[0] == 15
        assert database.execute("SELECT COUNT(*) FROM rate_versions").fetchone()[0] == 12
        assert database.execute("SELECT COUNT(*) FROM rate_versions WHERE is_current=1").fetchone()[0] == 9
    denied = subprocess.run([str(b.binary), "megaworld-demo", *b.flags], env=environment,
                            capture_output=True, text=True, timeout=15)
    assert denied.returncode != 0
    assert "restricted" in denied.stderr + denied.stdout
    assert not any(record["email"] == "demo@example.test" for record in b.records("staff", b.token))
    print("PASS: 15 mock-logo carriers/79 ports per owner, repeat seed preserves edits, isolated demo is idempotent")
