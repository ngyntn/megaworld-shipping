from support import COLLECTIONS
from test_realtime import check_realtime


def make_staff(b, suffix):
    record = b.create("staff", {"email": f"{suffix}@example.test", "password": b.password,
        "passwordConfirm": b.password, "name": suffix, "active": True})
    token = b.auth(f"{suffix}@example.test")["token"]
    owner = {"owner": record["id"]}
    carrier = b.create("carriers", {**owner, "code": "TEST", "name": suffix + " carrier", "active": True}, token)
    pol = b.create("ports", {**owner, "code": "POL", "name": "Origin", "country_code": "VN", "can_be_pol": True, "active": True}, token)
    pod = b.create("ports", {**owner, "code": "POD", "name": "Destination", "country_code": "US", "can_be_pod": True, "active": True}, token)
    route = b.create("routes", {**owner, "pol": pol["id"], "pod": pod["id"], "active": True}, token)
    shop = b.create("storefronts", {**owner, "slug": suffix, "display_name": suffix,
        "default_language": "vi", "published": True, "contact_email": f"contact-{suffix}@example.test"}, token)
    b.create("staff_settings", {**owner, "default_margin_cents": 15000, "expiry_warning_days": 7}, token)
    b.create("route_margins", {**owner, "route": route["id"], "margin_cents": 10000}, token)
    return {"staff": record, "token": token, "owner": owner, "carrier": carrier, "pol": pol, "pod": pod,
            "route": route, "shop": shop, "slug": suffix}


def check_access(b):
    a, other = make_staff(b, "alice"), make_staff(b, "bob")
    schema = b.api("/api/collections?perPage=100", token=b.token)["items"]
    assert COLLECTIONS.issubset({item["name"] for item in schema})
    for name in COLLECTIONS:
        assert b.records(name) == [], f"Anonymous data leak from {name}"
        b.api(f"/api/collections/{name}/records", {}, expected=(400, 403))
    assert len(b.records("staff", a["token"])) == 1
    assert len(b.records("carriers", a["token"])) == 1
    b.api(f"/api/collections/carriers/records/{other['carrier']['id']}", token=a["token"], expected=404)
    b.update("carriers", other["carrier"]["id"], {"name": "Stolen"}, a["token"], 404)
    b.update("carriers", a["carrier"]["id"], {"owner": other["staff"]["id"]}, a["token"], (400, 404))
    b.create("carriers", {**other["owner"], "code": "FORGED", "name": "Forged"}, a["token"], 400)
    b.create("routes", {**a["owner"], "pol": a["pol"]["id"], "pod": other["pod"]["id"]}, a["token"], (400, 404))
    b.update("routes", a["route"]["id"], {"pod": a["pol"]["id"]}, a["token"], 400)
    b.update("staff", a["staff"]["id"], {"active": False}, a["token"], (400, 404))
    b.update("staff", a["staff"]["id"], {"verified": True}, a["token"], (400, 404))
    b.update("staff", a["staff"]["id"], {"name": "Updated name"}, a["token"])
    b.create("staff", {"name": "Signup"}, a["token"], 403)
    for collection in ["rate_series", "rate_versions", "rate_costs", "rate_schedules", "search_daily_stats", "import_jobs", "schedules"]:
        b.create(collection, a["owner"], a["token"], 403)
    b.api(f"/api/collections/carriers/records/{a['carrier']['id']}", token=a["token"], method="DELETE", expected=403)
    shop = b.api("/api/megaworld/storefronts/alice")
    assert shop["contact_email"] == "contact-alice@example.test" and "owner" not in shop and "email" not in shop
    b.update("storefronts", a["shop"]["id"], {"published": False}, a["token"])
    b.api("/api/megaworld/storefronts/alice", expected=404)
    b.update("storefronts", a["shop"]["id"], {"published": True}, a["token"])
    check_realtime(b, a["token"])
    print("PASS: two-tenant isolation, immutable owner, private tables, no signup or privilege escalation")
    return a, other
