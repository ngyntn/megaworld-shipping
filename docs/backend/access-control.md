# Phân quyền backend

Quyền áp dụng tại PocketBase; frontend không phải ranh giới bảo mật.
Migration `1793740804_access_rules.js` mở quyền theo owner; hooks kiểm tra các quan hệ.

## Ma trận quyền

Tất cả quyền nhân viên yêu cầu đăng nhập collection `staff`, `active=true`, đúng owner.

| Tài nguyên | Khách | Nhân viên sở hữu | Nhân viên khác |
|---|---|---|---|
| staff | Không | Xem mình, sửa tên/chức vụ/điện thoại/email/mật khẩu | Không |
| storefronts | Custom API chỉ storefront published, owner active | Tạo/sửa/xem | Chỉ xem phần công khai |
| carriers, ports, routes | Catalog API của storefront xuất bản | Tạo/sửa/xem, không xóa | Chỉ xem phần công khai |
| staff_settings, route_margins | Không | Tạo/sửa/xem | Không |
| seed catalog | Không | Nhận bản ghi riêng, không truyền owner, không ghi đè dữ liệu đã có | Không seed thay nhân viên khác |
| rate_series, rate_versions | Custom API giá/historical công khai | Xem; ghi qua API lưu giá | Chỉ xem phần công khai |
| rate_costs | Không | Xem; ghi qua API lưu giá | Không |
| schedules | Lọc lịch scheduled và tải XLSX lịch tàu | Xem; custom API tạo/sửa/hủy, kiểm tra revision | Chỉ xem phần công khai |
| rate_schedules | Snapshot công khai trong lịch sử | Xem; ghi qua API lưu giá | Không đọc records API |
| search_daily_stats, import_jobs | Không đọc; gửi sự kiện tra tuyến hợp lệ | Xem; server ghi thống kê, preview/commit import riêng owner | Không |
| realtime | Không | Không | Không |

Superuser là người vận hành tin cậy, có toàn quyền ngoài ma trận. Không dùng superuser cho nhân viên
hoặc frontend. Superuser có thể sửa dữ liệu trực tiếp và phải chịu trách nhiệm giữ đúng lịch sử;
thao tác nghiệp vụ bình thường luôn dùng tài khoản staff và API lưu giá.

## Bảo vệ thao tác

- Nhân viên không tự tạo tài khoản, thay active/verified, sửa tài khoản khác hoặc xóa bản ghi.
- Đổi mật khẩu dùng oldPassword và passwordConfirm theo cơ chế PocketBase.
- Owner là bất biến; request không được đổi, kể cả khi gửi modifier trường.
- Các quan hệ route/carrier/port/version/schedule phải thuộc cùng owner.
- Route không được đổi POL/POD sau khi tạo; tạo route mới để giữ nghĩa của lịch sử.
- Khi lưu giá, route, cảng, hãng và series phải đang hoạt động.
- Schedule gắn vào phiên bản giá phải cùng owner, route, hãng, trạng thái scheduled và ETD trong validity.
- Nhân viên không được tạo/sửa trực tiếp sell_price, cost, margin, snapshot, revision hoặc is_current
  trong records API. Việc ghi chỉ diễn ra trong transaction server qua API lưu giá.
- expected_revision ngăn ghi đè thay đổi của request khác; lỗi trả 409, toàn bộ lần lưu rollback.
- Import preview giữ payload riêng trong import_jobs; commit không nhận lại dữ liệu giá từ client,
  kiểm tra revision lần nữa, nhập tất cả dòng hợp lệ trong một transaction và không nhập lặp job đã hoàn tất.
- Token còn hạn nhưng tài khoản bị tắt không đọc/ghi dữ liệu được; storefront cũng ngừng công khai.

## Bảo vệ dữ liệu riêng

Giá gốc/lợi nhuận/ghi chú nội bộ nằm trong rate_costs, staff_settings, route_margins và có thể xuất hiện
trong lỗi import_jobs; các collection này không có quyền đọc cho khách hoặc nhân viên khác.
API công khai dựng DTO từ danh sách trường cho phép, không gọi publicExport toàn bản ghi,
không join bảng giá gốc và không nhận expand/filter tùy ý.
Đăng ký realtime ứng dụng bị chặn tại server để không có kênh SSE ngoài API đã kiểm soát.
Logo hãng là tài sản công khai; không tải tài liệu riêng vào trường logo.

API tùy chỉnh dùng bearer token, không tự nhận cookie phiên. Khi làm Next.js sẽ bổ sung xử lý
cookie/CSRF tương ứng với kiến trúc frontend; quyền server PocketBase vẫn giữ nguyên.

## Kiểm tra

```powershell
python backend/scripts/verify.py
```

Kiểm tra tích hợp có hai nhân viên, giả owner, liên kết chéo owner, sửa active/verified,
tài khoản bị tắt với token cũ, API riêng, expand, realtime, storefront chưa xuất bản,
ghi trực tiếp bảng giá, dữ liệu giá công khai và rollback/concurrent update.
Không thay đổi database local đang dùng.
Kiểm tra mới bao gồm lịch tàu theo owner, export không có giá gốc, import chéo owner,
payload import riêng, dashboard riêng và dữ liệu công khai qua các bộ lọc mới.
