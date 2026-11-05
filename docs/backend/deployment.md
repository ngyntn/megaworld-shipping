# Triển khai backend và vận hành

Trạng thái: đã chuẩn bị cấu hình; **chưa triển khai lên VPS/domain** theo lựa chọn hiện tại.
Stack vận hành: một PocketBase instance + Python XLSX, Caddy TLS, Docker Compose và persistent volume.
Không chạy nhiều replica PocketBase trên cùng SQLite volume. Frontend Next.js triển khai riêng sau này.

## Chuẩn bị máy chủ

Dùng Linux x64/ARM64 có Docker Engine và Compose plugin, DNS domain backend trỏ về VPS,
mở cổng 80/443; cổng 8090 chỉ bind loopback. Không cần mở database hoặc PocketBase dashboard ra internet.
Không sao chép demo_data, pb_data local, credentials demo hoặc `.env` local lên production.
Image tải binary PocketBase đúng phiên bản/hash trong lock, không tải bản latest.

Từ thư mục gốc repository trên VPS:

```sh
cp backend/deploy/.env.example backend/deploy/.env
python3 backend/scripts/deploy_prepare.py
```

Sửa `.env`: BACKEND_DOMAIN thành domain thật, PB_ORIGINS thành origin HTTPS chính xác của frontend
(ngăn cách bằng dấu phẩy nếu nhiều), ACME_EMAIL thành email vận hành. Ví dụ app.example.com chỉ là placeholder;
entrypoint từ chối chạy với origin/domain mẫu. Domain backend được dùng cho PB_PUBLIC_URL.

Secret `backend/deploy/secrets/pb_encryption_key` được tạo ngẫu nhiên, không in ra terminal, không overwrite.
Giữ bản sao bí mật ở nơi khác. Trên Linux, directory secrets là 0700 và file 0644 để UID container 10001
đọc được bind mount; người dùng khác trên host không được đi qua directory. Không mount cả thư mục bí mật.
Nếu tự tạo file, đảm bảo quyền tương tự và khóa gồm đúng 32 ký tự ASCII.
Đây là khóa mã hóa cấu hình PocketBase, không phải mã hóa toàn bộ database hoặc file backup.

## Khởi động

```sh
docker compose --env-file backend/deploy/.env -f backend/deploy/compose.yaml config --quiet
docker compose --env-file backend/deploy/.env -f backend/deploy/compose.yaml build
docker compose --env-file backend/deploy/.env -f backend/deploy/compose.yaml up -d
docker compose --env-file backend/deploy/.env -f backend/deploy/compose.yaml ps
```

Container backend chạy UID 10001, filesystem chỉ đọc; dữ liệu nằm ở volume `/data`, `/tmp` là tmpfs.
Không giữ khóa hoặc password trong image. Caddy tự cấp/gia hạn TLS; volume Caddy giữ chứng chỉ.
Healthcheck kiểm tra `/api/health`. `serve` tự áp dụng migrations chưa chạy; không tự sinh migration từ dashboard.
Ứng dụng hiện có body limits cho import/upload; Caddy giới hạn tổng 3 MB/request.

Khởi tạo superuser qua terminal VPS, nhập password ẩn:

```sh
docker compose --env-file backend/deploy/.env -f backend/deploy/compose.yaml exec pocketbase python /app/scripts/container.py create-admin
```

Trên máy cá nhân tạo SSH tunnel:

```sh
ssh -L 8090:127.0.0.1:8090 USER@VPS
```

Mở `http://127.0.0.1:8090/_/` qua tunnel để quản trị. Caddy chỉ cho phép các đường dẫn API ứng dụng,
records API theo tên collection đã chọn, file logo và health; dashboard, auth superuser bằng tên hoặc ID,
schema management, backups/settings/logs/sql/crons không đi qua domain công khai.
Thao tác quản trị từ tunnel vẫn cần superuser. Nhân viên dùng staff và API ứng dụng.

## Cấu hình tự áp dụng khi production khởi động

- CORS giới hạn PB_ORIGINS, không dùng `*`; quyền dữ liệu vẫn kiểm tra tại PocketBase.
- Nhận X-Real-IP do Caddy ghi đè. Không đặt proxy/CDN khác trước Caddy khi chưa cấu hình lại trust chain.
- Rate limit: đăng nhập staff 10/phút/IP, import 10/phút/IP, API còn lại 300/phút/IP.
- Backup tự động mỗi ngày 19:00 UTC = 02:00 Việt Nam, giữ 7 bản cron.
- Không lưu IP/auth ID trong activity logs; giữ log 7 ngày. Code không ghi body chứa giá gốc vào log.
- Hook production được xem là nguồn cấu hình của các mục này: sửa qua dashboard sẽ bị đặt lại khi restart.

Email reset password cần cấu hình SMTP thật qua dashboard; dữ liệu SMTP được mã hóa bằng encryption key.
Không cấu hình SMTP giả hoặc gửi thử tới người khác. Tạo staff và seed catalog theo [seed-data.md](seed-data.md).
Chỉ publish storefront sau khi thông tin liên hệ, giá và danh mục đã được kiểm tra.

## Sao lưu

PocketBase tạo backup nhất quán gồm database, cấu hình, file upload local; cron giữ 7 bản trong volume.
Backup chứa giá gốc và dữ liệu riêng: không để trong thư mục public hay chia sẻ link ra ngoài.
Từ dashboard qua tunnel, tạo bản backup thủ công và tải về; hoặc cấu hình S3 backup riêng bằng thông tin
tài khoản thực trong Settings > Backups. Bản local không thay thế bản sao ngoài VPS.
Giữ encryption key, phiên bản source, pocketbase.lock.json và cấu hình domain riêng với backup.

Nếu muốn copy thủ công cả pb_data, phải dừng PocketBase trước. Không copy file SQLite đang được ghi.
Không dùng `docker compose down -v` vì lệnh đó xóa persistent volumes.

## Khôi phục và kiểm chứng

Đã có script khôi phục vào thư mục **chưa tồn tại**, không overwrite database đang dùng:

```sh
python3 backend/scripts/restore.py /secure/backups/pb_backup.zip /secure/restore-check
```

Script kiểm tra archive, từ chối path traversal/symlink, giữ file upload và chạy SQLite quick_check.
Không tự ghi đè `/data`. Để kiểm tra HTTP, chạy cùng phiên bản source/binary, migrations/hooks tương ứng
và encryption key cũ trên directory khôi phục, chỉ bind loopback với cổng khác.
Đăng nhập lại, kiểm tra số record, giá hiện hành/lịch sử, logo và phân quyền trước khi đổi traffic.

Khôi phục production qua chức năng Restore của dashboard/Backups API trong tunnel sau khi đã có bản backup
của hiện trạng. Thao tác này thay thế dữ liệu và restart server; thực hiện trong thời gian bảo trì.
Không đổi encryption key tùy ý; thiếu khóa cũ có thể không đọc được cấu hình mã hóa trong bản khôi phục.

## Cập nhật và rollback

1. Chạy bộ kiểm thử bằng source mới; lưu kết quả. Giữ image tag/source cũ ngoài image tag đang build lại.
2. Tạo backup trước khi áp dụng migration; tải một bản ra ngoài VPS.
3. Build image, restart backend, kiểm tra health/login/tra cứu/Excel và dashboard.
4. Nếu cần rollback, dùng image/source cũ cùng backup trước cập nhật trong thời gian bảo trì.

Không chạy migrate down tùy tiện trên dữ liệu thật: các migration khởi tạo down xóa collection.
Các nâng cấp PocketBase cần cập nhật lock/hash có chủ đích và kiểm thử restore với phiên bản tương ứng.

## Tình trạng xác minh

Cấu hình Compose đã được parser xác nhận hợp lệ. PocketBase production đã được chạy native để kiểm tra
settings encryption, CORS, rate limit và backup. Máy hiện tại không có Docker daemon hoạt động nên
**chưa build/chạy container hoặc TLS domain thực**. Workflow CI có job build image để xác minh trên runner Linux.
Khi có VPS/domain, cần chạy build/up và kiểm tra HTTPS, DNS, volume persistence và khôi phục tại môi trường đó.

Nguồn: [PocketBase production](https://pocketbase.io/docs/going-to-production/),
[Backups API](https://pocketbase.io/docs/api-backups/),
[Docker Compose services](https://docs.docker.com/reference/compose-file/services/),
[Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).
