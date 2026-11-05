from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import json


def check_rates(b, fixtures):
    a, other = fixtures
    today = datetime.now(timezone(timedelta(hours=7))).date()
    start, end = today.isoformat(), (today + timedelta(days=30)).isoformat()
    body = {"route": a["route"]["id"], "carrier": a["carrier"]["id"], "valid_from": start, "valid_to": end,
            "service_type": "direct", "transit_days": 18, "public_note": "For customer",
            "internal_note": "NEVER_PUBLIC", "lines": [{"container_type": "40HC", "cost_price_cents": 180050,
                "margin_mode": "row", "margin_cents": 15000, "expected_revision": 0}]}

    def save(payload, token=a["token"], expected=201):
        return b.api("/api/megaworld/admin/rates", payload, token, expected)

    b.api("/api/megaworld/admin/rates", expected=401, method="POST")
    save({**body, "carrier": other["carrier"]["id"]}, expected=404)
    for invalid in ["2026-02-30", "2026-13-01", "garbage"]:
        save({**body, "valid_from": invalid}, expected=400)
    save({**body, "valid_from": end, "valid_to": start}, expected=400)
    save({**body, "sell_price_cents": 1}, expected=400)
    for invalid in [None, "10000", -1, 1.5]:
        payload = deepcopy(body)
        payload["lines"][0]["cost_price_cents"] = invalid
        save(payload, expected=400)
    payload = deepcopy(body)
    del payload["lines"][0]["cost_price_cents"]
    save(payload, expected=400)
    save({**body, "lines": body["lines"] * 2}, expected=400)
    over_limit = deepcopy(body)
    over_limit["lines"][0]["cost_price_cents"] = 1000000000
    save(over_limit, expected=400)

    schedule = b.create("schedules", {**a["owner"], "route": body["route"], "carrier": body["carrier"],
        "vessel_name": "ORIGINAL VESSEL", "voyage": "001E", "etd": start, "eta": end,
        "service_type": "direct", "status": "scheduled"})
    body["schedule_ids"] = [schedule["id"]]
    foreign_schedule = b.create("schedules", {**other["owner"], "route": other["route"]["id"],
        "carrier": other["carrier"]["id"], "vessel_name": "Other vessel", "etd": start, "eta": end,
        "service_type": "direct", "status": "scheduled"})
    save({**body, "schedule_ids": [foreign_schedule["id"]]}, expected=404)
    first = save(body)["items"][0]
    assert first["sell_price_cents"] == 195050 and first["revision"] == 1 and first["validity_status"] == "valid"
    first_cost = b.records("rate_costs", a["token"])[0]
    assert first_cost["cost_price_cents"] == 180050 and first_cost["margin_cents"] == 15000
    # Anonymous expansion and back-relation filters must not return price records.
    assert b.records("rate_series", query="&expand=rate_versions_via_series.rate_costs_via_rate_version") == []
    assert not b.records("rate_costs", other["token"])
    b.api(f"/api/collections/rate_costs/records/{first_cost['id']}", expected=404)
    b.api(f"/api/collections/rate_costs/records/{first_cost['id']}", token=other["token"], expected=404)
    b.update("rate_versions", first["id"], {"sell_price_cents": 1}, a["token"], 403)
    b.update("rate_costs", first_cost["id"], {"margin_cents": 0}, a["token"], 403)
    b.api(f"/api/collections/rate_versions/records/{first['id']}", token=a["token"], method="DELETE", expected=403)
    save(body, expected=409)

    # Line 1 writes successfully; line 2 conflicts. Both must roll back.
    rollback = deepcopy(body)
    rollback["lines"].insert(0, {"container_type": "20GP", "cost_price_cents": 50000,
                               "margin_mode": "default", "expected_revision": 0})
    save(rollback, expected=409)
    assert len(b.records("rate_series", a["token"])) == 1
    assert len(b.records("rate_versions", a["token"])) == 1
    assert b.records("rate_versions", a["token"])[0]["is_current"]

    duplicate = b.api(f"/api/megaworld/admin/rates/{first['id']}/duplicate", token=a["token"])
    b.api(f"/api/megaworld/admin/rates/{first['id']}/duplicate", token=other["token"], expected=404)
    duplicate["lines"][0]["cost_price_cents"] = 190050
    second = save(duplicate)["items"][0]
    assert second["revision"] == 2 and second["sell_price_cents"] == 205050
    versions = b.records("rate_versions", a["token"])
    assert len(versions) == 2 and sum(item["is_current"] for item in versions) == 1
    assert next(item for item in versions if item["id"] == first["id"])["sell_price_cents"] == 195050
    b.update("schedules", schedule["id"], {"vessel_name": "CHANGED VESSEL"})
    history_url = f"/api/megaworld/storefronts/alice/rates/{first['series']}/history"
    history = b.api(history_url)["items"]
    assert history[0]["change_cents"] == 10000
    assert history[1]["schedules"][0]["vessel_name"] == "ORIGINAL VESSEL"
    b.api(f"/api/megaworld/storefronts/bob/rates/{first['series']}/history", expected=404)
    print("PASS: server price calculation, revisions, duplicate, snapshot history and transaction rollback")

    # Default, route and zero-value margins are explicit and independent.
    multi = deepcopy(body)
    multi["lines"] = [{"container_type": "20GP", "cost_price_cents": 50000, "margin_mode": "default", "expected_revision": 0},
                      {"container_type": "40GP", "cost_price_cents": 60000, "margin_mode": "route", "expected_revision": 0}]
    multi_result = save(multi)["items"]
    assert [item["sell_price_cents"] for item in multi_result] == [65000, 70000]
    margins = b.records("route_margins", a["token"])
    b.update("route_margins", margins[0]["id"], {"margin_cents": 0}, a["token"])
    zero = deepcopy(multi)
    zero["lines"] = [{"container_type": "40GP", "cost_price_cents": 0, "margin_mode": "route", "expected_revision": 1}]
    assert save(zero)["items"][0]["sell_price_cents"] == 0

    # Same expected revision in concurrent requests: only one succeeds.
    concurrent = deepcopy(duplicate)
    concurrent["lines"][0]["expected_revision"] = 2
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda _: save(concurrent, expected=(201, 409)), range(2)))
    assert sum("items" in result for result in responses) == 1

    # Expiry is evaluated when reading; no stored status or cron required.
    expired = deepcopy(multi)
    expired["schedule_ids"] = []
    expired["valid_from"] = (today - timedelta(days=10)).isoformat()
    expired["valid_to"] = (today - timedelta(days=1)).isoformat()
    expired["lines"] = [{"container_type": "20GP", "cost_price_cents": 1, "margin_mode": "default", "expected_revision": 1}]
    assert save(expired)["items"][0]["validity_status"] == "expired"
    upcoming = deepcopy(zero)
    upcoming["schedule_ids"] = []
    upcoming["valid_from"] = (today + timedelta(days=1)).isoformat()
    upcoming["lines"][0]["expected_revision"] = 2
    assert save(upcoming)["items"][0]["validity_status"] == "upcoming"
    public_url = "/api/megaworld/storefronts/alice/rates"
    public = b.api(public_url)
    assert [item["validity_status"] for item in public["items"]] == ["valid", "upcoming", "expired"]
    assert b.api(public_url + "?per_page=1")["has_more"]
    assert b.api(public_url + "?per_page=1&page=3")["items"][0]["validity_status"] == "expired"
    b.api(public_url + "?expand=rate_costs_via_rate_version", expected=400)
    b.api(public_url + "?per_page=1000000", expected=400)
    assert b.api("/api/megaworld/storefronts/bob/rates")["items"] == []
    for response in [public, b.api(history_url), b.api("/api/megaworld/storefronts/alice")]:
        encoded = json.dumps(response)
        assert not any(word in encoded for word in ["cost_price_cents", "margin_cents", "internal_note", "NEVER_PUBLIC", "owner", "tokenKey"])
    assert b.records("rate_versions", query="&expand=rate_costs_via_rate_version") == []

    # Disable account while tokens are still valid: both private and public access stop.
    b.update("staff", a["staff"]["id"], {"active": False})
    assert not b.records("rate_costs", a["token"])
    b.api("/api/megaworld/admin/rates", token=a["token"], expected=403, method="POST")
    b.api(public_url, expected=404)
    b.auth("alice@example.test", expected=403)
    print("PASS: margin modes, concurrent updates, validity ordering/pagination, public redaction and disabled accounts")
