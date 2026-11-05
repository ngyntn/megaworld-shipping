# API lịch tàu, tra cứu, Excel và dashboard

Base: `http://127.0.0.1:8090`. Xác thực và API lưu giá xem [api.md](api.md).
API `/admin/` yêu cầu `Authorization: TOKEN` của staff active, chỉ thao tác dữ liệu cùng owner.
API storefront chỉ hoạt động khi published=true và chủ tài khoản active=true.

## Quản lý lịch tàu

| Method và endpoint | Hành vi |
|---|---|
| `POST /api/megaworld/admin/schedules` | Tạo chuyến, trả 201 |
| `PATCH /api/megaworld/admin/schedules/{id}` | Sửa/hủy chuyến, trả 200 |
| `GET /api/megaworld/admin/schedules` | Danh sách lịch tàu riêng, gồm cả cancelled |

Payload tạo hoặc sửa là đầy đủ các trường bắt buộc:

```json
{
  "route": "ROUTE_RECORD_ID",
  "carrier": "CARRIER_RECORD_ID",
  "vessel_name": "ONE EXAMPLE",
  "voyage": "001E",
  "etd": "2026-11-15",
  "eta": "2026-12-03",
  "service_type": "direct",
  "transshipment_port": "",
  "status": "scheduled",
  "public_note": "",
  "expected_revision": 0
}
```

Thay ID bằng ID thực. Tạo mới dùng expected_revision=0; sửa dùng revision đã đọc từ response.
Trả 409 nếu dữ liệu đã đổi. Không nhận owner hoặc transit_days từ client. Server tự tính transit_days
từ ETA−ETD; ngày phải hợp lệ và ETA≥ETD. Transit phải có transshipment_port.
Status là scheduled/cancelled; hủy bằng PATCH status=cancelled, không xóa lịch có liên kết lịch sử.
Snapshot lịch sử giá vẫn giữ thông tin tại thời điểm lưu giá khi lịch tàu thay đổi.
Nhập Excel lịch tàu thuộc phạm vi tương lai theo SRS, chưa triển khai.

## Catalog và tra cứu công khai

Tiền luôn là integer USD cents; tên trường/tập giá trị không phụ thuộc ngôn ngữ giao diện.

| GET endpoint dưới `/api/megaworld/storefronts/{slug}` | Nội dung |
|---|---|
| `/catalog/ports` | Cảng active: code/unlocode, tên vi/en/zh, country_code, region, cờ POL/POD |
| `/catalog/carriers` | Hãng active: code, tên, logo, collection_id để dựng URL file |
| `/catalog/routes` | Route active: ID POL/POD để ánh xạ với catalog cảng |
| `/rates` | Giá hiện hành của các loại container, gồm cả hết hạn/chưa hiệu lực |
| `/compare` | Các hãng cùng tuyến/container, chỉ giá hiện hành còn hiệu lực |
| `/schedules` | Các chuyến scheduled, sắp xếp ETD tăng dần |
| `/schedules/export` | Tải file Excel `.xlsx` lịch tàu cùng bộ lọc |

Tất cả danh sách JSON nhận page/per_page như API giá; dữ liệu được phân trang trước khi trả.
Không có phân trang trong export: lấy toàn bộ dữ liệu phù hợp, tối đa 5000 chuyến; vượt giới hạn
trả 400 và cần thu hẹp bộ lọc. page/per_page không giới hạn số dòng export.

| Bộ lọc query | Rates / Compare | Schedules / Admin schedules / Export |
|---|---|---|
| route | ID route | ID route |
| pol, pod | ID cảng | ID cảng |
| carrier | ID hãng | ID hãng |
| container_type | 20GP/40GP/40HC | Không |
| status | all/valid/upcoming/expired; compare chỉ valid | Admin: scheduled/cancelled; công khai chỉ scheduled |
| sort | price, price_desc, transit, departure | Không; ETD tăng dần |
| from, to | Không | Khoảng ETD gồm cả hai đầu, YYYY-MM-DD |

Compare bắt buộc container_type và route (hoặc đủ pol/pod). Giá hết hạn không xuất hiện khi so sánh.
Rates luôn ưu tiên còn hạn, rồi chưa hiệu lực, rồi hết hạn; sort áp dụng bên trong từng nhóm.
next_departure là ETD sớm nhất của chuyến scheduled cùng tuyến/hãng, từ hôm nay và trong validity;
không có chuyến thì null và xếp sau khi sort=departure.
Nhân viên khác cũng chỉ thấy DTO công khai khi dùng API storefront; không có giá gốc/lãi/ghi chú riêng.

Ví dụ:

```text
GET /api/megaworld/storefronts/nguyen-an/rates?pol=PORT_ID&pod=PORT_ID&container_type=40HC&sort=price
GET /api/megaworld/storefronts/nguyen-an/compare?route=ROUTE_ID&container_type=40HC&sort=departure
GET /api/megaworld/storefronts/nguyen-an/schedules?route=ROUTE_ID&from=2026-11-01&to=2026-11-30
```

## Import giá từ Excel

1. `GET /api/megaworld/admin/imports/template` tải template `.xlsx` có dòng ví dụ.
2. Sửa dữ liệu theo mã danh mục của chính nhân viên; tải lên qua `POST /api/megaworld/admin/imports/preview`.
3. Hiển thị kết quả mới/thay thế/lỗi; xác nhận bằng `POST /api/megaworld/admin/imports/{job_id}/commit` với `{}`.

Request preview:

```json
{
  "file_name": "gia-cuoc.xlsx",
  "file_base64": "BASE64_OF_XLSX_BYTES"
}
```

Response 201 có id, status, total_rows, valid_rows, new_rows, replacement_rows, errors và items.
errors chứa row/message; items chứa số dòng Excel, action=new/replace, giá gốc/lãi/giá bán và revision.
Đây là dữ liệu riêng của người đang đăng nhập. Preview kiểm tra bằng chính logic lưu giá nhưng rollback,
không thay đổi giá hiện hành. Payload hợp lệ được giữ trong import_jobs; client không được sửa job trực tiếp.

Các cột template:

```text
carrier_code, pol_code, pod_code, container_type, cost_price_usd,
margin_mode, margin_usd, valid_from, valid_to, service_type, transit_days,
local_charges, surcharges, public_note, internal_note
```

Cột từ carrier_code đến transit_days bắt buộc có header, trừ margin_usd có thể bỏ khi không dùng row mode.
Các cột sau transit_days tùy chọn. Tiền trong Excel dùng USD, dấu chấm thập phân, tối đa hai chữ số,
không kèm ký hiệu tiền hoặc dấu phân cách hàng nghìn. API tự chuyển sang cents chính xác.
Row mode cần margin_usd; default/route để trống margin_usd và dùng cấu hình lợi nhuận hiện có.
Ngày là YYYY-MM-DD hoặc ô Excel định dạng ngày, không có giờ. Mỗi dòng ứng với một container.
File không tạo hãng/cảng/tuyến mới; cần tạo danh mục trước. Không gắn lịch tàu khi import giá.

Hỗ trợ XLSX một worksheet, tối đa 2 MiB/500 dòng dữ liệu; body JSON tối đa 3 MB.
Không hỗ trợ XLS/XLSM, workbook có macro, mã hóa, công thức hoặc nhiều worksheet.
Reader hỗ trợ inline/shared string, số và serial date; giá trị Boolean/error không được nhập.
Thay công thức bằng giá trị trước khi upload. Đây là import bảng dữ liệu, không giữ định dạng Excel.

Commit chỉ nhập các dòng preview hợp lệ, bỏ qua dòng lỗi theo mockup. Các dòng hợp lệ cùng một transaction:
một xung đột revision trả 409 và rollback toàn bộ lần nhập; cần preview file lại.
Preview hết hạn sau 24 giờ. Commit lặp/concurrent trên job completed trả lại kết quả cũ, không thêm revision.
Response có id, status=completed, imported_rows, items. Job không có dòng hợp lệ có status=failed, không commit được.
Sau commit payload được xóa; kết quả và báo lỗi được giữ riêng để tra cứu qua records API import_jobs.

## Thống kê dashboard

`GET /api/megaworld/admin/dashboard` trả dữ liệu của nhân viên đang đăng nhập:

- summary: updated_last_7_days, valid_rates, significant_changes.
- latest_rates: 5 phiên bản tạo gần nhất; dùng created, không dùng updated khi chuyển cờ lịch sử.
- expiring_rates: 5 giá hiện hành sắp hết hạn, theo expiry_warning_days trong staff_settings.
- top_routes: 5 tuyến có số lượt tra lớn nhất trong 7 ngày lịch Việt Nam, gồm hôm nay.
- significant_changes: 5 biến động giá hiện hành lớn nhất, ngưỡng ≥10% so với revision liền trước.

Giá thay đổi từ 0 lên số dương có change_percent=null; change_cents vẫn có giá trị.
Số dòng giá tính theo container. Thống kê không đọc giá gốc hoặc lợi nhuận.

Frontend gọi `POST /api/megaworld/storefronts/{slug}/searches` với `{"route":"ROUTE_RECORD_ID"}`
một lần cho mỗi thao tác tìm kiếm chủ động. Không gọi lại khi phân trang, xem lịch sử hoặc render lại.
Endpoint tăng số đếm ngày một cách atomic, không nhận count/owner/ngày từ khách và không lưu IP/danh tính.
Lượt tra là số sự kiện nhận được, không phải số khách duy nhất; GET danh sách không tự tăng thống kê.

## Runtime và kiểm tra

Chạy bằng `python backend/scripts/pb.py serve` để tự cấu hình interpreter Python cho Excel.
Nếu chạy binary trực tiếp, đặt PB_PYTHON là đường dẫn Python 3.10+ trên máy chủ.
Không cần package Python bên ngoài; không dùng shell để chạy script và không ghi file Excel tạm.

```powershell
python backend/scripts/verify.py
```

Kiểm tra gồm XLSX thực, shared string/serial date, formula/row limits, không lộ dữ liệu riêng,
phân quyền lịch tàu/import/dashboard, preview không ghi giá, commit không nhập lặp và rollback xung đột.
OOXML theo [cấu trúc SpreadsheetML của Microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/structure-of-a-spreadsheetml-document).
