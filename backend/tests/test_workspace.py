from test_access import make_staff


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
    quote = b.create("saved_quotes", {**owner, "rate_version": "a" * 15, "route_label": "Cát Lái → Los Angeles",
        "carrier_code": "ONE", "container_type": "40HC", "price_cents": 280000, "valid_to": "2026-11-30"}, token)
    b.create("saved_quotes", {**owner, "rate_version": "a" * 15, "route_label": "Trùng", "carrier_code": "ONE",
        "container_type": "40HC", "price_cents": 1, "valid_to": "2026-11-30"}, token, 400)

    for collection, record in [("workspace_events", event), ("workspace_notes", note), ("saved_quotes", quote)]:
        path = f"/api/collections/{collection}/records/{record['id']}"
        b.api(path, token=other["token"], method="DELETE", expected=404)
        b.api(path, token=token, method="DELETE", expected=204)
    print("PASS: workspace events, notes and saved quotes are private to their owner")
