# Backend PocketBase

Bước 1–12: backend nghiệp vụ, seed catalog, demo riêng, bộ kiểm thử và cấu hình vận hành.
Chưa có frontend; cấu hình hosting đã chuẩn bị, chưa triển khai lên VPS/domain.

- [Quy tắc nghiệp vụ](../docs/backend/business-rules.md)
- [Database và sơ đồ quan hệ](../docs/backend/database.md)
- [API và ví dụ lưu giá](../docs/backend/api.md)
- [Phân quyền](../docs/backend/access-control.md)
- [API lịch tàu, tra cứu, Excel và dashboard](../docs/backend/operations-api.md)
- [Seed và demo local](../docs/backend/seed-data.md)
- [Tích hợp frontend Next.js](../docs/backend/frontend-integration.md)
- [Triển khai và backup/restore](../docs/backend/deployment.md)
- [Kết quả kiểm thử](../docs/backend/verification.md)

## Chạy cục bộ

Yêu cầu Python 3.10+ và kết nối mạng để tải binary lần đầu; không cần Node.js cho backend này.
Python cũng được dùng khi import/export XLSX, bằng thư viện chuẩn, không cần cài package Excel.
Chạy từ thư mục gốc repository:

```powershell
python backend/scripts/install.py
Copy-Item backend/.env.example backend/.env
python backend/scripts/pb.py migrate up
python backend/scripts/pb.py serve
```

Trên Linux/macOS, thay `Copy-Item` bằng `cp`. Các script tự xác định đường dẫn dự án.
Mặc định chỉ lắng nghe `127.0.0.1:8090`. Truy cập dashboard tại `http://127.0.0.1:8090/_/`
và làm theo liên kết cài đặt in trong terminal để tự tạo superuser đầu tiên.
Không có tài khoản/mật khẩu mẫu. Giữ riêng liên kết cài đặt và token.

`serve` tự áp dụng migration chưa chạy. `--automigrate=false` tắt sinh migration tự động
khi sửa schema qua dashboard; mọi thay đổi dự án cần được viết thành migration có version trong Git.
Không sửa schema trực tiếp qua dashboard ngoài thao tác khảo sát trên database dùng thử.

## Phiên bản và môi trường

`pocketbase.lock.json` ghim **0.40.6**, đã xác minh có release chính thức qua GitHub API khi khởi tạo.
Installer kiểm tra SHA256 archive trước khi ghi executable, hỗ trợ Windows/Linux/macOS x64 và ARM64.
Tài liệu web có thể hiển thị bản mới hơn; không tự nâng binary vì API có thể thay đổi trước 1.0.
Nâng cấp có chủ đích bằng cập nhật lock/hash và chạy lại kiểm thử migrations.

`pb.py` đọc `backend/.env` dạng `KEY=value` đơn giản (không nội suy biến); biến môi trường tiến trình
được ưu tiên. `PB_HTTP` cấu hình địa chỉ; `POCKETBASE_URL` dành cho Next.js sau này.
Ngày nghiệp vụ hiện cố định theo Việt Nam UTC+07:00 trong helper validation; `APP_TIMEZONE` là
thông tin cấu hình dành cho tích hợp, chưa cho phép đổi múi giờ trong runtime.
Không cần cấu hình khóa bí mật để chạy local.
`pb.py` tự đặt `PB_PYTHON` bằng interpreter đang chạy; có thể cấu hình đường dẫn Python 3 khác trong `.env`.
Nếu chạy trực tiếp binary PocketBase khi triển khai, đặt `PB_PYTHON` thành đường dẫn Python 3 phù hợp.

```text
backend/
  scripts/            # Cài đặt, chạy và kiểm tra
  pb_migrations/      # Schema version trong Git
  pb_hooks/           # Security, rates, API và helper theo trách nhiệm
  tests/              # Kiểm thử HTTP, phân quyền, tính giá và lịch sử
  pocketbase.lock.json
  .env.example
  bin/                # Binary local, bỏ qua Git
  pb_data/            # Database/file/runtime, bỏ qua Git
```

## Kiểm tra

```powershell
python backend/scripts/verify.py
```

Kiểm tra dùng database tạm riêng, không đọc/sửa `backend/pb_data`. Chạy migrate up hai lần,
khởi động HTTP, kiểm tra hai nhân viên, quan hệ chéo owner, chống nâng quyền, khóa realtime,
giá công khai không lộ giá gốc, transaction rollback, sửa đồng thời, tiền theo cents và snapshot lịch sử.
Có kiểm tra lịch tàu, so sánh, bộ lọc, XLSX thực, preview import không ghi giá, commit có lỗi bỏ qua,
commit lặp không tạo revision trùng, xung đột import rollback và dashboard riêng từng nhân viên.
Sau đó kiểm tra down/up đủ 6 migrations. Tài khoản kiểm thử sinh ngẫu nhiên, không ghi vào repository.
Kiểm tra thêm seed idempotent riêng owner, ảnh logo thực, demo biệt lập, live backup/restore gồm file,
khởi động lại từ bản khôi phục, production settings encryption, CORS và rate limiting.
Workflow CI ở `.github/workflows/backend.yml` chạy kiểm thử trên Linux/Windows và build image trên Linux.

## Trạng thái bảo mật hiện tại

Nhân viên đang hoạt động chỉ đọc dữ liệu của mình và tạo/sửa danh mục, storefront, cài đặt.
Lưu giá phải qua custom API; không được sửa/xóa trực tiếp bảng giá hoặc lịch sử.
Khách dùng custom API theo slug storefront; records API không cho khách đọc dữ liệu.
Realtime bị khóa cho khách/nhân viên; superuser dashboard vẫn dùng được.
Người vận hành tạo bản ghi `staff` qua dashboard, đặt mật khẩu và `active=true`; nhân viên gọi
`POST /api/megaworld/admin/setup/catalog` với `{}` để nhận 15 hãng và 79 cảng riêng của mình.
Không seed giá dùng thật. Demo local riêng ở `backend/demo_data`, có password ngẫu nhiên trong file được ignore.
Xem hướng dẫn seed để chạy demo bằng cổng 8091. Nhân viên dùng staff, không dùng superuser.

Thư mục deploy có Dockerfile, Compose, Caddy TLS, persistent volume và entrypoint đọc encryption secret.
Đã chuẩn bị cấu hình backup hằng ngày, giữ 7 bản; xem deployment.md để sao lưu ngoài máy chủ và restore.
Không commit `.env`, binary, file database, backup hay token. Không đưa superuser secret vào `NEXT_PUBLIC_*`.

Tài liệu chính thức: [Khởi động](https://pocketbase.io/docs/),
[Authentication](https://pocketbase.io/docs/authentication/),
[Production](https://pocketbase.io/docs/going-to-production/).
