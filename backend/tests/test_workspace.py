from test_access import make_staff
from support import ROOT


def check_workspace(b):
    """Personal calendar, notes and saved quotes: owner-only CRUD and field validation."""
    a, other = make_staff(b, "wsalice"), make_staff(b, "wsbob")
    token, owner = a["token"], a["owner"]
    event = b.create("workspace_events", {**owner, "title": "Gọi khách", "day": "2026-11-06",
        "time": "09:00", "category": "customer"}, token)
    b.create("workspace_events", {**owner, "title": "Không giờ", "day": "2026-11-07", "category": "other"}, token)
    b.create("workspace_events", {**owner, "title": "Sai ngày", "day": "2026-02-30", "category": "rate"}, token, 400)
    b.create("workspace_events", {**owner, "title": "Sai giờ", "day": "2026-11-06", "time": "25:00", "category": "rate"}, token, 400)
    b.create("workspace_events", {**other["owner"], "title": "Giả mạo", "day": "2026-11-06", "category": "rate"}, token, 400)
    b.update("workspace_events", event["id"], {"title": "Gọi lại khách"}, token)
    b.update("workspace_events", event["id"], {"owner": other["staff"]["id"]}, token, (400, 404))
    b.update("workspace_events", event["id"], {"title": "Chiếm"}, other["token"], 404)
    assert len(b.records("workspace_events", token)) == 2
    assert b.records("workspace_events", other["token"]) == []
    assert b.records("workspace_events") == []

    note = b.create("workspace_notes", {**owner, "title": "Nhắc việc", "body": "Gửi lịch tàu", "kind": "reminder"}, token)
    b.create("workspace_notes", {**owner, "body": "Chỉ có nội dung", "kind": "quote"}, token)
    b.create("workspace_notes", {**owner, "title": " ", "body": "", "kind": "other"}, token, 400)
    b.create("workspace_notes", {**owner, "title": "Loại lạ", "kind": "red"}, token, 400)
    # Reapply the new migration against populated legacy records.
    b.stop()
    count = sum(path.name >= "1793740808_workspace_tags.js" for path in (ROOT / "pb_migrations").glob("*.js"))
    b.cli("migrate", "down", str(count), input_text="y\n")
    b.cli("migrate", "up")
    b.start()
    migrated = b.api(f"/api/collections/workspace_events/records/{event['id']}", token=token)
    migrated_tag = b.api(f"/api/collections/workspace_tags/records/{migrated['tag']}", token=token)
    assert migrated_tag["name"] == "Khách hàng"
    migrated_note = b.api(f"/api/collections/workspace_notes/records/{note['id']}", token=token)
    assert migrated_note["tag"] and migrated_note["body"] == "Gửi lịch tàu"
    endpoint = "/api/megaworld/admin/workspace/notes/reorder"
    ordered = b.records("workspace_notes", token, "&sort=position,-created,id")
    first, last = ordered[0], ordered[-1]
    b.api(endpoint, {"id": first["id"], "target_id": last["id"]}, token)
    after = b.records("workspace_notes", token, "&sort=position,-created,id")
    assert after[-1]["id"] == first["id"], [(item["title"], item["id"], item["position"]) for item in after]
    b.update("workspace_notes", first["id"], {"body": "Edited without changing position"}, token)
    assert b.records("workspace_notes", token, "&sort=position,-created,id")[-1]["id"] == first["id"]
    b.api(endpoint, {"id": first["id"], "target_id": last["id"]}, token)
    assert b.records("workspace_notes", token, "&sort=position,-created,id")[0]["id"] == first["id"]
    foreign = b.create("workspace_notes", {**other["owner"], "title": "Private note", "kind": "other"}, other["token"])
    before = [(item["id"], item["position"]) for item in b.records("workspace_notes", token, "&sort=position,-created,id")]
    for source, target in [(first["id"], foreign["id"]), (foreign["id"], first["id"])]:
        b.api(endpoint, {"id": source, "target_id": target}, token, 404)
    assert [(item["id"], item["position"]) for item in b.records("workspace_notes", token, "&sort=position,-created,id")] == before
    b.api(endpoint, {"id": first["id"], "target_id": first["id"]}, token)
    b.api(endpoint, {"id": first["id"], "target_id": last["id"]}, expected=401)
    b.api(endpoint, {"id": "bad", "target_id": last["id"]}, token, 400)
    tag = b.create("workspace_tags", {**owner, "name": "Follow up", "color": "rose"}, token)
    b.create("workspace_tags", {**owner, "name": "Invalid", "color": "red"}, token, 400)
    b.create("workspace_tags", {**owner, "name": "  ", "color": "blue"}, token, 400)
    b.create("workspace_tags", {**owner, "name": "Follow up", "color": "blue"}, token, 400)
    assert b.records("workspace_tags", other["token"]) == []
    b.update("workspace_tags", tag["id"], {"name": "Follow up soon", "color": "purple"}, token)
    b.update("workspace_tags", tag["id"], {"name": "Stolen"}, other["token"], 404)
    b.update("workspace_events", event["id"], {"tag": tag["id"]}, token)
    b.update("workspace_notes", note["id"], {"tag": tag["id"]}, token)
    foreign_tag = b.create("workspace_tags", {**other["owner"], "name": "Private", "color": "blue"}, other["token"])
    for collection, record in [("workspace_events", event), ("workspace_notes", note)]:
        b.update(collection, record["id"], {"tag": foreign_tag["id"]}, token, (400, 404))
    b.api(f"/api/collections/workspace_tags/records/{tag['id']}", token=token, method="DELETE", expected=204)
    for collection, record in [("workspace_events", event), ("workspace_notes", note)]:
        stored = b.api(f"/api/collections/{collection}/records/{record['id']}", token=token)
        assert stored["tag"] == "" and stored["title"]
    quote = b.create("saved_quotes", {**owner, "rate_version": "a" * 15, "route_label": "Cát Lái → Los Angeles",
        "carrier_code": "ONE", "container_type": "40HC", "price_cents": 280000, "valid_to": "2026-11-30"}, token)
    b.create("saved_quotes", {**owner, "rate_version": "a" * 15, "route_label": "Trùng", "carrier_code": "ONE",
        "container_type": "40HC", "price_cents": 1, "valid_to": "2026-11-30"}, token, 400)

    for collection, record in [("workspace_events", event), ("workspace_notes", note), ("saved_quotes", quote)]:
        path = f"/api/collections/{collection}/records/{record['id']}"
        b.api(path, token=other["token"], method="DELETE", expected=404)
        b.api(path, token=token, method="DELETE", expected=204)
    print("PASS: workspace events, notes and saved quotes are private to their owner")
