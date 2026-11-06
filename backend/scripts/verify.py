"""Run real HTTP integration tests on a disposable PocketBase database."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tests"))
from support import instance
from test_access import check_access
from test_rates import check_rates
from test_operations import check_operations
from test_workspace import check_workspace
from test_workbook import check_workbook
from test_seed import check_seed
from test_restore import check_restore
from test_production import check_production


def main():
    check_workbook()
    with instance() as backend:
        fixtures = check_access(backend)
        check_rates(backend, fixtures)
        check_operations(backend)
        check_workspace(backend)
        check_seed(backend)
        check_restore(backend)
        check_production(backend)
        backend.rollback_and_reapply()
    print("All backend checks passed; local pb_data was untouched.")


if __name__ == "__main__":
    main()
