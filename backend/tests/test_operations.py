import base64
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import io
import json
import urllib.request
import zipfile
from test_access import make_staff
from workbook_writer import write_workbook
from workbook_reader import read_workbook

HEADERS = ["carrier_code", "pol_code", "pod_code", "container_type", "cost_price_usd", "margin_mode", "margin_usd", "valid_from", "valid_to", "service_type", "transit_days", "local_charges", "surcharges", "public_note", "internal_note"]
SCHEDULE_HEADERS = ["carrier_code", "pol_code", "pod_code", "vessel_name", "voyage", "etd", "eta", "service_type", "transshipment_port", "public_note"]


def check_operations(b):
    a, other = make_staff(b, "carol"), make_staff(b, "dave")
    today = datetime.now(timezone(timedelta(hours=7))).date()
    start, end = today.isoformat(), (today + timedelta(days=30)).isoformat()
    public = "/api/megaworld/storefronts/carol"
    token = a["token"]
    schedule_body = {"route": a["route"]["id"], "carrier": a["carrier"]["id"], "vessel_name": "Test ship",
        "voyage": "001E", "etd": start, "eta": (today + timedelta(days=18)).isoformat(),
        "service_type": "direct", "status": "scheduled", "expected_revision": 0}
    schedule = b.api("/api/megaworld/admin/schedules", schedule_body, token, 201)
    assert schedule["revision"] == 1 and schedule["transit_days"] == 18
    b.api("/api/megaworld/admin/schedules", {**schedule_body, "carrier": other["carrier"]["id"]}, token, 404)
    b.api("/api/megaworld/admin/schedules", {**schedule_body, "eta": "2026-02-30"}, token, 400)
    b.api("/api/megaworld/admin/schedules", {**schedule_body, "service_type": "transit"}, token, 400)
    schedule_path = "/api/megaworld/admin/schedules/" + schedule["id"]
    b.api(schedule_path, {**schedule_body, "expected_revision": 1}, other["token"], 404, "PATCH")
    b.api(schedule_path, schedule_body, token, 409, "PATCH")
    assert len(b.api(public + "/schedules?from=" + start + "&to=" + end)["items"]) == 1
    assert not b.api(public + "/schedules?route=" + other["route"]["id"])["items"]
    cancelled = b.api(schedule_path, {**schedule_body, "expected_revision": 1, "status": "cancelled"}, token, method="PATCH")
    assert cancelled["revision"] == 2
    assert not b.api(public + "/schedules")["items"]
    b.api(schedule_path, {**schedule_body, "expected_revision": 2}, token, method="PATCH")
    assert b.api("/api/megaworld/admin/schedules?status=scheduled", token=token)["items"]
    assert not b.api("/api/megaworld/admin/schedules", token=other["token"])["items"]
    for name in ["ports", "carriers", "routes"]:
        records = b.api(public + "/catalog/" + name)["items"]
        assert records and "owner" not in records[0]
    b.api(public + "/catalog/rate_costs", expected=404)

    body = {"route": a["route"]["id"], "carrier": a["carrier"]["id"], "valid_from": start, "valid_to": end,
        "service_type": "direct", "transit_days": 18, "lines": [{"container_type": "40HC", "cost_price_cents": 100000,
            "margin_mode": "row", "margin_cents": 10000, "expected_revision": 0}]}
    first = b.api("/api/megaworld/admin/rates", body, token, 201)["items"][0]
    second_carrier = b.create("carriers", {**a["owner"], "code": "SECOND", "name": "Second carrier", "active": True}, token)
    body2 = deepcopy(body)
    body2["carrier"] = second_carrier["id"]
    body2["transit_days"] = 10
    body2["lines"][0]["cost_price_cents"] = 150000
    b.api("/api/megaworld/admin/rates", body2, token, 201)
    query = "?route=" + a["route"]["id"] + "&container_type=40HC"
    comparison = b.api(public + "/compare" + query)["items"]
    assert len(comparison) == 2 and comparison[0]["sell_price_cents"] == 110000
    assert comparison[0]["next_departure"] == start
    assert b.api(public + "/compare" + query + "&sort=transit")["items"][0]["transit_days"] == 10
    assert b.api(public + "/compare" + query + "&sort=departure")["items"][0]["next_departure"] == start
    assert len(b.api(public + "/rates?pol=" + a["pol"]["id"] + "&pod=" + a["pod"]["id"] + "&carrier=" + second_carrier["id"])["items"]) == 1
    b.api(public + "/compare", expected=400)
    b.api(public + "/rates?sort=DROP%20TABLE", expected=400)
    b.api(public + "/rates?container_type=45HC", expected=400)

    def download(path):
        request = urllib.request.Request(f"http://127.0.0.1:{b.port}" + path, headers={"Authorization": token})
        with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(request, timeout=15) as response:
            assert response.headers["Content-Type"].startswith("application/vnd.openxmlformats")
            assert response.headers["Cache-Control"] == "no-store"
            return response.read()

    exported = download(public + "/schedules/export?route=" + a["route"]["id"])
    with zipfile.ZipFile(io.BytesIO(exported)) as workbook:
        xml = workbook.read("xl/worksheets/sheet1.xml").decode()
        assert "Test ship" in xml and "cost_price" not in xml and "&lt;f&gt;" not in xml
    template = download("/api/megaworld/admin/imports/template")
    assert read_workbook(base64.b64encode(template))[0]["values"] == HEADERS
    for index in range(8):
        b.api("/api/megaworld/admin/schedules", {**schedule_body, "voyage": f"PAGE-{index}"}, token, 201)
    first_page = b.api("/api/megaworld/admin/schedules?per_page=8&status=scheduled", token=token)
    assert first_page["total"] == 9 and first_page["pages"] == 2
    assert len(first_page["items"]) == 8 and first_page["has_more"]
    second_page = b.api("/api/megaworld/admin/schedules?per_page=8&page=2&pol=" + a["pol"]["id"], token=token)
    assert second_page["total"] == 9 and len(second_page["items"]) == 1 and not second_page["has_more"]
    empty_page = b.api("/api/megaworld/admin/schedules?per_page=8&status=cancelled", token=token)
    assert empty_page["total"] == 0 and empty_page["pages"] == 1
    assert b.api("/api/megaworld/admin/schedules?per_page=8", token=other["token"])["total"] == 0
    print("PASS: schedule CRUD/cancellation, scoped pagination totals, public catalogs/filters/comparison and real XLSX download")

    def preview(rows, expected=201):
        file = write_workbook([HEADERS, *rows])
        return b.api("/api/megaworld/admin/imports/preview", {"file_name": "prices.xlsx",
            "file_base64": base64.b64encode(file).decode()}, token, expected)

    row = ["TEST", "POL", "POD", "40HC", "1900.50", "row", "150", start, end, "direct", "18", "", "", "Public", "IMPORT_PRIVATE"]
    fresh = [*row]; fresh[3] = "20GP"
    bad = [*row]; bad[0] = "MISSING"
    job = preview([row, fresh, bad])
    assert job["valid_rows"] == 2 and job["replacement_rows"] == 1 and len(job["errors"]) == 1
    assert job["items"][0]["sell_price_cents"] == 205050
    assert len(b.records("rate_versions", token)) == 2, "Preview wrote persistent price data"
    commit = "/api/megaworld/admin/imports/" + job["id"] + "/commit"
    b.api(commit, {}, other["token"], 404)
    result = b.api(commit, {}, token)
    assert result["imported_rows"] == 2
    count = len(b.records("rate_versions", token))
    assert b.api(commit, {}, token) == result
    assert len(b.records("rate_versions", token)) == count
    assert not b.records("import_jobs", other["token"])
    assert not b.records("import_jobs")
    assert "IMPORT_PRIVATE" not in json.dumps(b.api(public + "/rates"))

    # Preview captures revisions; later modification causes a complete rollback on commit.
    conflict = preview([fresh, row])
    modified = deepcopy(body)
    modified["lines"][0]["expected_revision"] = 2
    b.api("/api/megaworld/admin/rates", modified, token, 201)
    before = len(b.records("rate_versions", token))
    b.api("/api/megaworld/admin/imports/" + conflict["id"] + "/commit", {}, token, 409)
    assert len(b.records("rate_versions", token)) == before
    assert preview([row, row])["valid_rows"] == 1
    b.api("/api/megaworld/admin/imports/preview", {"file_name": "bad.xlsx", "file_base64": "not-base64"}, token, 400)

    # Schedule workbook import: new/update/error rows, automatic route creation, isolation and job-kind separation.
    template = download("/api/megaworld/admin/schedule-imports/template")
    assert read_workbook(base64.b64encode(template))[0]["values"] == SCHEDULE_HEADERS
    pod2 = b.create("ports", {**a["owner"], "code": "POD2", "name": "Second destination", "country_code": "US", "can_be_pod": True, "active": True}, token)
    eta = (today + timedelta(days=18)).isoformat()

    def schedule_preview(rows, expected=201, auth=token):
        file = write_workbook([SCHEDULE_HEADERS, *rows])
        return b.api("/api/megaworld/admin/schedule-imports/preview", {"file_name": "schedules.xlsx",
            "file_base64": base64.b64encode(file).decode()}, auth, expected)

    existing = ["TEST", "POL", "POD", "Test ship", "001E", start, eta, "direct", "", ""]
    new_voyage = ["TEST", "POL", "POD", "Test ship", "IMP-1", start, eta, "direct", "", "Imported"]
    new_route = ["TEST", "POL", "POD2", "Feeder", "IMP-2", start, eta, "transit", "SINGAPORE", ""]
    bad_dates = ["TEST", "POL", "POD", "Test ship", "IMP-3", eta, start, "direct", "", ""]
    bad_transit = ["TEST", "POL", "POD", "Test ship", "IMP-4", start, eta, "transit", "", ""]
    job = schedule_preview([existing, new_voyage, new_route, bad_dates, bad_transit, new_voyage])
    assert job["valid_rows"] == 3 and job["new_rows"] == 2 and job["update_rows"] == 1 and len(job["errors"]) == 3
    schedules_before = b.api("/api/megaworld/admin/schedules", token=token)["total"]
    routes_before = len(b.records("routes", token))
    assert b.api("/api/megaworld/admin/schedules", token=token)["total"] == schedules_before, "Preview wrote schedules"
    commit = "/api/megaworld/admin/schedule-imports/" + job["id"] + "/commit"
    b.api(commit, {}, other["token"], 404)
    b.api("/api/megaworld/admin/imports/" + job["id"] + "/commit", {}, token, 400)
    result = b.api(commit, {}, token)
    assert result["imported_rows"] == 3
    assert b.api("/api/megaworld/admin/schedules", token=token)["total"] == schedules_before + 2
    assert len(b.records("routes", token)) == routes_before + 1
    assert b.api(commit, {}, token) == result
    assert b.api("/api/megaworld/admin/schedules", token=token)["total"] == schedules_before + 2
    # A rate-import job cannot be committed as schedules, and unknown carriers are rejected per row.
    rate_job = preview([fresh])
    b.api("/api/megaworld/admin/schedule-imports/" + rate_job["id"] + "/commit", {}, token, 400)
    assert schedule_preview([["MISSING", *existing[1:]]])["valid_rows"] == 0
    # Preview captures revisions; editing a schedule afterwards rolls the whole commit back.
    stale = schedule_preview([existing, ["TEST", "POL", "POD", "Late ship", "IMP-9", start, eta, "direct", "", ""]])
    current = b.api("/api/megaworld/admin/schedules?per_page=50", token=token)["items"]
    target = next(item for item in current if item["voyage"] == "001E")
    b.api("/api/megaworld/admin/schedules/" + target["id"], {**schedule_body, "expected_revision": target["revision"], "public_note": "changed"}, token, method="PATCH")
    total = b.api("/api/megaworld/admin/schedules", token=token)["total"]
    b.api("/api/megaworld/admin/schedule-imports/" + stale["id"] + "/commit", {}, token, 409)
    assert b.api("/api/megaworld/admin/schedules", token=token)["total"] == total
    b.api("/api/megaworld/admin/schedule-imports/preview", {"file_name": "bad.xlsx", "file_base64": "not-base64"}, token, 400)

    b.api(public + "/searches", {"route": a["route"]["id"]})
    b.api(public + "/searches", {"route": a["route"]["id"]})
    b.api(public + "/searches", {"route": other["route"]["id"]}, expected=404)
    dashboard = b.api("/api/megaworld/admin/dashboard", token=token)
    assert dashboard["summary"]["valid_rates"] == 3
    assert dashboard["summary"]["updated_last_7_days"] == len(b.records("rate_versions", token))
    assert dashboard["summary"]["significant_changes"] >= 1
    assert dashboard["top_routes"][0]["searches"] == 2
    assert not b.api("/api/megaworld/admin/dashboard", token=other["token"])["latest_rates"]
    b.api("/api/megaworld/admin/dashboard", expected=401)
    print("PASS: XLSX preview/skip errors/commit, import isolation/idempotency/conflict rollback and dashboard analytics")
