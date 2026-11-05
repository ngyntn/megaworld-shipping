# Server hooks

- `01_production.pb.js`: backup cron, rate limit, proxy trust và log settings khi PB_ENV=production.
- `10_security.pb.js`: kiểm tra owner, quan hệ và ngày; giới hạn sửa tài khoản; trạng thái validity; khóa realtime cho ứng dụng.
- `20_rates.pb.js`: API lưu giá bằng transaction và chuẩn bị nhân bản.
- `30_public.pb.js`: API storefront, giá hiện hành và lịch sử qua danh sách trường công khai cho phép.
- `40_operations.pb.js`: quản lý lịch tàu, dashboard và import Excel cho nhân viên.
- `50_discovery.pb.js`: danh mục, lọc lịch tàu, so sánh, tải Excel lịch tàu và ghi nhận lượt tra.
- `60_setup.pb.js`: seed catalog theo tài khoản và CLI demo bị giới hạn ở database demo riêng.
- `70_account.pb.js`: `POST /api/megaworld/admin/account/email` đổi email đăng nhập sau khi kiểm tra mật khẩu hiện tại (PocketBase không cho chủ tài khoản tự đổi `email`); logic ở `lib/account.js`.
- `70_account.pb.js` (tiếp): `POST /api/megaworld/admin/delete` xoá hàng loạt `{ kind: rates|schedules|carriers|ports, ids }` trong một transaction; dữ liệu còn được tham chiếu sẽ bị bỏ qua kèm lý do (xem `lib/deletion.js`).
- `lib/validation.js`: kiểm tra đầu vào, integer cents và ngày Việt Nam.
- `lib/security.js`: kiểm tra tài khoản, owner và storefront được xuất bản.
- `lib/rates-save.js`: tính giá, kiểm soát revision, lưu lịch sử và snapshot.
- `lib/rates-read.js`: phân trang, sắp xếp validity và phản hồi công khai.
- `lib/query.js`, `rates-query.js`, `catalog.js`: bộ lọc SQL có bind parameters, phân trang và danh mục.
- `lib/schedules.js`, `dashboard.js`: logic lịch tàu và thống kê theo owner.
- `lib/imports.js`, `import-rows.js`, `excel.js`: xem trước/xác nhận import, ánh xạ dòng và cầu nối Python XLSX.

Hook handler PocketBase chạy trong context riêng; luôn `require` helper bên trong handler.
Code trong `lib/` là CommonJS chạy bằng JSVM của PocketBase, không dùng API Node.js.
Thay đổi hook trên Windows cần khởi động lại server.
Xem [API](../../docs/backend/api.md) và [phân quyền](../../docs/backend/access-control.md).
Các API mới ở [operations-api.md](../../docs/backend/operations-api.md).
Hướng dẫn [seed/demo](../../docs/backend/seed-data.md) và [triển khai](../../docs/backend/deployment.md).
