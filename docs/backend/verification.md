# Xác minh backend

Ngày kiểm tra: 04/11/2026, PocketBase 0.40.6, Windows x64/Python 3.11.
Chạy từ root repository:

```powershell
python backend/scripts/install.py
python backend/scripts/verify.py
```

Mỗi lần kiểm tra tạo database tạm trong backend/.test-data, không dùng dữ liệu ứng dụng hoặc demo local.
Tài khoản/password sinh ngẫu nhiên. Các tiến trình, SQLite connection và file log đóng trước cleanup.

## Phạm vi đã kiểm tra

| Nhóm | Kết quả xác minh |
|---|---|
| Migrations | Từ database trống, up lặp, down cả 6 migration, up lại và khởi động HTTP |
| Xác thực | Staff active, inactive với token cũ, không tự đăng ký hoặc nâng verified/active |
| Cách ly nhân viên | List/view/update, giả owner, relation chéo owner, bất biến owner |
| Dữ liệu riêng | Không lộ cost/margin/internal_note qua public DTO, records, expand, realtime, import hoặc export |
| Giá | Integer cents, số 0 hợp lệ, thiếu/null/sai giá bị từ chối, tính lãi row/route/default |
| Lịch sử | Revision, một giá hiện hành, giữ bản cũ, duplicate, snapshot tàu không đổi theo sửa lịch |
| Transaction | Nhiều container rollback toàn bộ khi một dòng lỗi, sửa đồng thời không ghi đè |
| Validity | Còn hạn/chưa hiệu lực/hết hạn theo ngày Việt Nam, thứ tự và phân trang |
| Lịch tàu | Tạo/sửa/hủy, ETA/ETD, transit port, revision conflict, quyền riêng và lọc công khai |
| Tra cứu/so sánh | Catalog, tuyến/cảng/hãng/container, giá/transit/ETD, chặn query không được phép |
| Excel | File XLSX thực, shared string, số, serial date, chặn formula/row limit, xuất literal text |
| Import | Preview không ghi giá, lỗi từng dòng, bỏ dòng lỗi, commit lặp không nhập trùng, conflict rollback |
| Dashboard | Giá mới/hiện hành/biến động, đếm lượt tra theo tuyến và cách ly owner |
| Seed | 15 hãng có file logo, 79 cảng/owner, chạy lại giữ dữ liệu đã sửa, demo riêng idempotent |
| Backup/restore | Live backup, database/logo, khôi phục đích mới, từ chối traversal/overwrite, boot lại API từ bản khôi phục |
| Production native | Settings encryption, cấu hình cron giữ 7 bản, CORS, rate limit, tạo backup |

Source kiểm thử nằm ở backend/tests, runner ở backend/scripts/verify.py.
CI được chuẩn bị cho Windows/Linux và job build Docker image; workflow chưa được chạy trên GitHub trong phiên này.

## Cấu hình triển khai

Compose config đã được parser xác nhận hợp lệ. Native PocketBase production đã được chạy trong database
thử riêng; không đổi cấu hình production lên database local ứng dụng.
Docker daemon hiện chưa chạy nên chưa build/chạy image hoặc kiểm tra Caddy/TLS end to end.
Chưa có VPS/domain theo lựa chọn người dùng. Xem [deployment.md](deployment.md) để chạy khi có hạ tầng.

Đây là kiểm thử chức năng/tích hợp, không phải số liệu chịu tải hoặc bảo đảm hiệu năng production.
Mã cảng chưa đối chiếu được vẫn để unlocode trống theo [seed metadata](../../backend/seed/README.md).
Giá/lịch demo đều là giả lập; dữ liệu thương mại thật do nhân viên cung cấp sau.
