"""Restore a PocketBase backup into a new directory; never replace running data."""
import argparse
from contextlib import closing
from pathlib import Path, PurePosixPath
import shutil
import sqlite3
import stat
import zipfile


def restore(archive, target):
    archive, target = Path(archive).resolve(), Path(target).resolve()
    if target.exists():
        raise ValueError("Restore target must not exist; choose a new empty destination.")
    with zipfile.ZipFile(archive) as backup:
        entries = backup.infolist()
        names = set()
        for item in entries:
            name = PurePosixPath(item.filename)
            if name.is_absolute() or ".." in name.parts or "\\" in item.filename or ":" in item.filename or stat.S_ISLNK(item.external_attr >> 16):
                raise ValueError("Unsafe backup member.")
            if item.filename in names:
                raise ValueError("Duplicate backup member.")
            names.add(item.filename)
        if "data.db" not in names or backup.testzip():
            raise ValueError("Invalid PocketBase backup.")
        target.mkdir(parents=True, exist_ok=False, mode=0o700)
        for item in entries:
            path = (target / item.filename).resolve()
            if not path.is_relative_to(target):
                raise ValueError("Backup member escapes the restore directory.")
            if item.is_dir():
                path.mkdir(parents=True, exist_ok=True)
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                with backup.open(item) as source, path.open("xb") as destination:
                    shutil.copyfileobj(source, destination)
    with closing(sqlite3.connect(f"{(target / 'data.db').as_uri()}?mode=ro", uri=True)) as database:
        if database.execute("PRAGMA quick_check").fetchone()[0] != "ok":
            raise ValueError("Restored database failed integrity verification.")
    return target


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("target", type=Path)
    options = parser.parse_args()
    print(f"Restored and verified: {restore(options.archive, options.target)}")
