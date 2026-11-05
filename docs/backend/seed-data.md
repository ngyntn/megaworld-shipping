# Khởi tạo dữ liệu và demo

Danh mục gốc ở [backend/seed](../../backend/seed/README.md): 15 hãng có logo PNG mock,
6 POL và 73 POD thuộc các khu vực trong SRS. Không có giá thị trường hoặc mật khẩu mặc định.

## Dữ liệu dùng thật

1. Người vận hành tạo tài khoản `staff` qua PocketBase dashboard; đặt email/password, name, active=true.
2. Đăng nhập tài khoản nhân viên qua API xác thực trong [api.md](api.md).
3. Gọi API bằng token của nhân viên:

```http
POST /api/megaworld/admin/setup/catalog
Authorization: STAFF_TOKEN
Content-Type: application/json

{}
```

Server tự lấy owner từ tài khoản, không nhận owner tùy ý. Kết quả có carriers/ports với số created/skipped.
Mỗi nhân viên nhận bản ghi riêng. Chạy lại bỏ qua code đã tồn tại, không ghi đè tên/logo/cờ hoạt động
đã sửa và không tạo trùng. Seed không tạo storefront, route hoặc giá thương mại để tránh xuất bản nhầm.
Nhân viên cấu hình storefront/contact, default margin và tạo tuyến cần dùng theo tài liệu API.

Trường `code` là mã nội bộ dùng trong import, có thể khác mockup. Sáu POL dùng CAT_LAI, CAI_MEP,
THI_VAI, HAI_PHONG, LACH_HUYEN, DINH_VU. Đối chiếu `unlocode` riêng trước khi dùng mã trên chứng từ;
chỉ 3 mã đã đối chiếu được điền, các mã còn lại để trống. Logo đều là mock, có thể thay bằng ảnh hãng.

## Demo local đã chuẩn bị

```powershell
python backend/scripts/demo.py setup
python backend/scripts/demo.py serve
```

Demo chỉ dùng `backend/demo_data`, không sửa `backend/pb_data` của ứng dụng.
Tài khoản/password ngẫu nhiên nằm ở `backend/.demo-credentials.json`, được bỏ qua Git.
Không đưa file này lên hosting hoặc commit. Nếu file thông tin đăng nhập bị mất mà demo_data còn,
script dừng và yêu cầu khôi phục/reset tài khoản demo; không ghi ra mật khẩu mới sai với database cũ.

Sau khi chạy serve, dùng các URL:

```text
http://127.0.0.1:8091/api/megaworld/storefronts/megaworld-demo
http://127.0.0.1:8091/api/megaworld/storefronts/megaworld-demo/rates
http://127.0.0.1:8091/api/megaworld/storefronts/megaworld-demo/catalog/routes
http://127.0.0.1:8091/api/megaworld/storefronts/megaworld-demo/schedules
```

Có 3 hãng trên tuyến Cát Lái–Los Angeles, 3 chuyến tàu, 9 chuỗi giá và 12 phiên bản.
Bao gồm giá valid/upcoming/expired, lịch sử, snapshot và giá gốc/lãi riêng để kiểm tra phân quyền.
Ngày sinh theo ngày Việt Nam lúc tạo; demo không tự đổi lịch tàu hoặc tạo thêm revision khi chạy lại.
Mọi giá/tàu đều gắn DEMO, là dữ liệu giả lập. Thông tin liên hệ dùng example.test và không thể giao dịch.
Chạy setup lần nữa không ghi đè dữ liệu demo đã chỉnh. Không có superuser mẫu trong demo database.
