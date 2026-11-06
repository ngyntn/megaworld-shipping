"""Build the frontend first, then run this test against an isolated PocketBase database."""
import io
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

FRONTEND = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(FRONTEND.parent / "backend" / "tests"))
from support import instance
from test_access import make_staff

NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
DETAILS = {"client": "Excel Test Client", "contact": "Test PIC", "address": "Test address", "sales": "Test sales", "quantity": 1}


def sheet_values(content):
    with zipfile.ZipFile(io.BytesIO(content)) as workbook:
        sheets = []
        for name in workbook.namelist():
            if name.startswith("xl/worksheets/sheet") and name.endswith(".xml"):
                root = ET.fromstring(workbook.read(name))
                sheets.append({c.get("r"): "".join(c.itertext()) for c in root.findall(".//s:c", NS) if c.get("t") == "inlineStr"})
        return sheets


def main():
    with instance() as backend:
        account, other = make_staff(backend, "export-owner"), make_staff(backend, "export-other")
        schedule_ids, rate_ids = [], []
        for i in range(105):
            row = backend.create("schedules", {**account["owner"], "route": account["route"]["id"], "carrier": account["carrier"]["id"],
                "vessel_name": f"{'TARGET' if i % 2 == 0 else 'OTHER'} SHIP {i}", "voyage": str(i), "etd": "2026-11-10", "eta": "2026-11-30", "service_type": "direct", "status": "scheduled"})
            schedule_ids.append(row["id"])
        for i in range(24):
            carrier = backend.create("carriers", {**account["owner"], "code": f"EX{i:02d}", "name": f"Export carrier {i}", "active": True}, account["token"])
            result = backend.api("/api/megaworld/admin/rates", {"route": account["route"]["id"], "carrier": carrier["id"],
                "valid_from": "2026-11-01", "valid_to": "2099-11-30", "service_type": "direct", "transit_days": 20,
                "local_charges": "", "surcharges": "", "trade_term": "FOB", "cargo_type": "GC", "public_note": "Public remark", "internal_note": "DO NOT EXPORT",
                "lines": [{"container_type": c, "cost_price_cents": 100050, "margin_mode": "row", "margin_cents": 25025, "expected_revision": 0} for c in ["20GP", "40GP", "40HC"]]}, account["token"], 201)
            rate_ids.append([r["id"] for r in result["items"]])
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        artifacts = FRONTEND / ".verification" / "excel"
        artifacts.mkdir(parents=True, exist_ok=True)
        log = (artifacts / "next.log").open("w", encoding="utf-8")
        process = subprocess.Popen(["node", "node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", str(port)],
            cwd=FRONTEND, stdout=log, stderr=log, env={**os.environ, "POCKETBASE_URL": f"http://127.0.0.1:{backend.port}"})
        base = f"http://127.0.0.1:{port}"
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

        def export(kind, filters=None, ids=None, token=account["token"], expected=200):
            body = {"scope": "selected" if ids is not None else "filtered", "ids": ids or [], "filters": filters or {}, "details": DETAILS}
            headers = {"Content-Type": "application/json"}
            if token:
                headers["Cookie"] = f"megaworld_session={token}"
            request = urllib.request.Request(f"{base}/admin/{kind}/export", json.dumps(body).encode(), headers)
            try:
                response = opener.open(request, timeout=45)
            except urllib.error.HTTPError as error:
                response = error
            with response:
                data = response.read()
                assert response.code == expected, f"Export {kind}: {response.code}: {data[:300]}"
                assert response.headers["Cache-Control"] == "no-store"
                if expected == 200:
                    assert "spreadsheetml" in response.headers["Content-Type"]
                return data

        try:
            deadline = time.monotonic() + 25
            while True:
                assert process.poll() is None, "Next.js exited; check .verification/excel/next.log"
                try:
                    with opener.open(base + "/admin/login", timeout=3):
                        break
                except OSError:
                    assert time.monotonic() < deadline
                    time.sleep(0.2)
            for kind in ["rates", "schedules"]:
                export(kind, token=None, expected=401)
                export(kind, ids=[], expected=400)
            all_schedules = export("schedules", {"page": "2", "per_page": "1"})
            assert sum(" SHIP " in text for sheet in sheet_values(all_schedules) for text in sheet.values()) == 105
            filtered = export("schedules", {"q": "TARGET", "pol": account["pol"]["id"], "from": "2026-11-01", "to": "2026-11-30", "status": "scheduled"})
            assert sum("TARGET SHIP" in text for sheet in sheet_values(filtered) for text in sheet.values()) == 53
            chosen = export("schedules", ids=[schedule_ids[-1], schedule_ids[0]])
            assert sum(" SHIP " in text for sheet in sheet_values(chosen) for text in sheet.values()) == 2
            export("schedules", ids=[schedule_ids[0]], token=other["token"], expected=409)
            export("schedules", {"q": "DOES NOT EXIST"}, expected=400)
            all_rates = export("rates", {"tab": "current", "page": "2", "per_page": "1"})
            sheets = sheet_values(all_rates)
            assert len(sheets) == 3
            assert all(sum(text.startswith("EX") for ref, text in sheet.items() if ref.startswith("E")) == 24 for sheet in sheets)
            selected = export("rates", {"tab": "current"}, ids=rate_ids[0])
            assert all(sum(text.startswith("EX") for ref, text in sheet.items() if ref.startswith("E")) == 1 for sheet in sheet_values(selected))
            matches = export("rates", {"tab": "current", "q": "EX01", "pol": account["pol"]["id"], "pod": account["pod"]["id"], "month": "2026-11"})
            assert all(sum(text == "EX01" for text in sheet.values()) == 1 for sheet in sheet_values(matches))
            export("rates", {"q": "EX01"}, ids=rate_ids[0], expected=409)
            export("rates", ids=rate_ids[0], token=other["token"], expected=409)
            for name, data in [("http-schedules", all_schedules), ("http-quotation", all_rates)]:
                (artifacts / f"{name}.xlsx").write_bytes(data)
            print("PASS: authenticated downloads, checkbox rows, all filtered pages, search/date/route filters, multi-container quotes, empty results and owner isolation", flush=True)
            if "--preview" in sys.argv:
                (artifacts / "session.json").write_text(json.dumps({"url": base, "token": account["token"]}), encoding="utf-8")
                print(f"Preview ready: {base}; session is stored locally in .verification/excel/session.json", flush=True)
                input("Press Enter to stop the isolated preview.\n")
        finally:
            process.terminate()
            process.wait(timeout=15)
            log.close()


if __name__ == "__main__":
    main()
