"""PocketBase XLSX bridge: JSON over stdin, JSON or binary workbook over stdout."""
import json
import sys
from workbook_reader import read_workbook
from workbook_writer import write_workbook


def main():
    action = sys.argv[1]
    body = json.loads(sys.stdin.buffer.read(4 * 1024 * 1024))
    if action == "read":
        try:
            rows = read_workbook(body["file_base64"])
            result = {"rows": rows}
        except (ValueError, KeyError, IndexError, OSError, OverflowError) as error:
            result = {"error": str(error)[:300]}
        except Exception:
            result = {"error": "Invalid or unsupported XLSX workbook."}
        sys.stdout.write(json.dumps(result, ensure_ascii=True))
    elif action == "write":
        sys.stdout.buffer.write(write_workbook(body["rows"]))
    else:
        raise ValueError("Unknown XLSX action.")


if __name__ == "__main__":
    main()
