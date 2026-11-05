# API backend bước 4–6

Base local: `http://127.0.0.1:8090`. Tiền trong request/response đều là **integer USD cents**.
Chưa có frontend. Các API lịch tàu, bộ lọc đầy đủ, so sánh, Excel và dashboard xem tại
[operations-api.md](operations-api.md).

## Xác thực và chuẩn bị dữ liệu

Người vận hành dùng dashboard `/_/` tạo tài khoản trong collection `staff`, đặt name/email/password,
bật active. Không dùng `_superusers` làm nhân viên. Không có đăng ký công khai.

Đăng nhập:

```http
POST /api/collections/staff/auth-with-password
Content-Type: application/json

{"identity":"nhanvien@example.com","password":"YOUR_PASSWORD"}
```

Lấy `token` từ response; gửi `Authorization: TOKEN` cho request nhân viên.
Refresh bằng `POST /api/collections/staff/auth-refresh`; đăng xuất bằng xóa token tại client.
Khi tích hợp Next.js không dùng một authStore người dùng chung cho nhiều request phía server.

Trước khi lưu giá, nhân viên tạo các bản ghi sau qua records API chuẩn PocketBase:

1. `storefronts`: owner = ID tài khoản, slug duy nhất, display_name, default_language vi/en/zh,
   published và các trường liên hệ.
2. `carriers`: owner, code, name, active=true; logo tùy chọn.
3. `ports`: owner, code nội bộ, name, country_code; cờ can_be_pol/can_be_pod phù hợp, active=true.
   POL phải là cảng Việt Nam được cấu hình cho hàng xuất; dùng danh mục đúng phạm vi SRS.
4. `routes`: owner, pol và pod là ID cảng cùng owner, active=true.
5. `staff_settings`: owner, default_margin_cents, expiry_warning_days; `route_margins` tùy chọn
   gồm owner, route, margin_cents.

Endpoint records chuẩn: `POST /api/collections/{name}/records`,
`GET /api/collections/{name}/records`, `PATCH /api/collections/{name}/records/{id}`.
Gửi owner khi tạo; không đổi owner sau khi tạo. Chưa có endpoint seed/onboarding tự động.
Không xóa danh mục; cập nhật active=false để ngưng sử dụng.

## Lưu giá

```http
POST /api/megaworld/admin/rates
Authorization: TOKEN
Content-Type: application/json
```

```json
{
  "route": "ROUTE_RECORD_ID",
  "carrier": "CARRIER_RECORD_ID",
  "valid_from": "2026-11-01",
  "valid_to": "2026-11-30",
  "service_type": "direct",
  "transit_days": 18,
  "local_charges": "THC 20/40: 145/210 USD; Bill 45 USD",
  "surcharges": "LSS 80 USD/container",
  "public_note": "Free 14 ngày DEM/DET",
  "internal_note": "Ghi chú riêng",
  "schedule_ids": [],
  "lines": [
    {
      "container_type": "40HC",
      "cost_price_cents": 190000,
      "margin_mode": "row",
      "margin_cents": 15000,
      "expected_revision": 0
    }
  ]
}
```

Thay các ID mẫu bằng ID thực gồm 15 ký tự PocketBase. Response `201`:

```json
{
  "items": [
    {
      "id": "new_version_id",
      "series": "rate_series_id",
      "container_type": "40HC",
      "revision": 1,
      "sell_price_cents": 205000,
      "validity_status": "valid"
    }
  ]
}
```

validity_status trong ví dụ chỉ là minh họa, giá trị thật phụ thuộc ngày Việt Nam lúc gọi API.

- Gửi 1–3 dòng, mỗi container duy nhất: 20GP, 40GP, 40HC. Không gửi owner hoặc sell_price.
- `margin_mode=row`: bắt buộc margin_cents. `route`: dùng margin tuyến, chưa cấu hình thì fallback
  default của nhân viên. `default`: dùng default trực tiếp. Hai chế độ sau không nhận margin_cents.
- `expected_revision=0` khi tạo chuỗi mới. Khi sửa, gửi revision hiện hành đã đọc từ dữ liệu của mình.
  Trả 409 nếu không khớp; tải lại trước khi lưu. Không tự retry bằng cách bỏ qua revision.
- Toàn bộ container, giá gốc, lịch sử và snapshot được lưu cùng transaction. Một lỗi làm rollback tất cả.
- Thiếu hoặc null cost bị từ chối; 0 là số tiền thật. Loại container bỏ khỏi request giữ nguyên giá cũ.
- Trường tùy chọn: trade_term (tối đa 20 ký tự), cargo_type (40), public_note (4000), internal_note (8000),
  local_charges/surcharges (2000 mỗi trường). Không tự cộng mô tả phụ phí vào giá bán.
- schedule_ids tối đa 100, không trùng; các chuyến phải cùng owner/tuyến/hãng và ETD trong validity.
  Tạo/sửa lịch tàu qua custom API ở [operations-api.md](operations-api.md).
- Body tối đa 64 KiB. Các khoản tiền không âm, tối đa 1 tỷ cents; tổng giá bán cũng không vượt giới hạn.

## Chuẩn bị nhân bản

`GET /api/megaworld/admin/rates/{version_id}/duplicate` yêu cầu token đúng owner.
Trả payload tương thích API lưu, chứa cost/margin/internal_note **chỉ cho chủ sở hữu**.
Không ghi database cho tới khi POST lưu. schedule_ids để trống để chọn lại lịch cho đợt mới.
Nếu đổi route/carrier/container, frontend cần lấy lại expected_revision của chuỗi đích (0 nếu chưa có).

## Đọc công khai

Không cần token; storefront phải published=true và chủ tài khoản active=true.

| Endpoint GET | Nội dung |
|---|---|
| `/api/megaworld/storefronts/{slug}` | Tên hiển thị, liên hệ, ngôn ngữ; không có email đăng nhập |
| `/api/megaworld/storefronts/{slug}/rates` | Giá hiện hành; còn hạn trước, chưa hiệu lực tiếp theo, hết hạn sau |
| `/api/megaworld/storefronts/{slug}/rates/{series_id}/history` | Revision mới trước, giá cũ, chênh lệch và snapshot lịch tàu |

Hai endpoint giá nhận `page` (mặc định 1, tối đa 10000), `per_page` (mặc định 20, tối đa 100).
Response có items/page/per_page/has_more. Rates hỗ trợ filter tuyến/hãng/container và sort theo
[operations-api.md](operations-api.md); history chỉ nhận phân trang. Không nhận expand tùy ý.
Không trả cost, margin, internal_note, owner hoặc dữ liệu tài khoản.
Các giá gắn danh mục/series inactive bị loại; lịch sử vẫn lưu trong database để nhân viên xem.
Trạng thái validity tính khi đọc: valid/upcoming/expired. Ngày bắt đầu/kết thúc đều tính trọn ngày Việt Nam.
History trả previous_sell_price_cents/change_cents = null nếu không có revision trước đó.

## Đọc riêng và mã lỗi

Nhân viên đọc records API để lấy toàn bộ dữ liệu thuộc mình, bao gồm rate_costs.
Khách hoặc nhân viên khác không đọc được dữ liệu riêng; list trả items rỗng, view trả 404 theo PocketBase.
POST/PATCH/DELETE trực tiếp các bảng giá bị khóa (403), kể cả chủ sở hữu.

- 400: input không hợp lệ, ngày sai, tiền sai, thiếu cấu hình lãi, field không được phép.
- 401/403: chưa đăng nhập, sai loại tài khoản, tài khoản bị tắt hoặc thao tác bị khóa.
- 404: không tồn tại hoặc không thuộc owner/storefront được yêu cầu.
- 409: revision đã thay đổi do request khác.
- 413: body vượt giới hạn.

Các endpoint tùy chỉnh đặt Cache-Control: no-store. Không ghi request chứa giá gốc vào log ứng dụng.
Không đăng ký realtime cho khách/nhân viên; dùng HTTP API hiện tại.
