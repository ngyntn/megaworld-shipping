# Kiểm tra Admin module 1

Đã kiểm tra ngày 04/11/2026 với backend demo riêng ở cổng 8091.

- `npm run typecheck`: thành công.
- `npm run build`: thành công; login và dashboard render động phía server.
- Chrome DevTools: truy cập dashboard không có phiên chuyển tới login; sai mật khẩu hiện lỗi tiếng Việt; tài khoản demo đăng nhập và tải dữ liệu API thành công; đăng xuất trở về login.
- Cookie phiên không xuất hiện qua `document.cookie` (HttpOnly).
- Tìm kiếm không khớp trả trạng thái trống ở cả 3 bảng; chuông mở danh sách cảnh báo.
- Không có lỗi/warning console trên dashboard.
- Desktop 1920×907: form login trùng bounding box mockup (400×540, x=1265, y=183.5). Sidebar rộng 241.125px, header cao 73px và ba thẻ thống kê cao 154px trùng mẫu. Màu sắc, font Inter, khoảng cách, border và bố cục đối chiếu từ mockup.
- Mobile 390×844: không tràn ngang; sidebar và các thẻ chuyển thành bố cục dọc.

Giới hạn: chưa đo pixel diff tổng thể để khẳng định tỷ lệ 99%. Icon dùng Lucide có khác biệt nét nhỏ so với SVG mẫu. Dữ liệu demo không có lượt tra, giá biến động ≥10% hoặc giá sắp hết hạn tại lúc kiểm tra, nên các trạng thái có dữ liệu của ba nhóm này chưa được kiểm tra end-to-end. Không sửa giá/demo để tạo số liệu giả. Các màn hình ngoài module 1 chưa triển khai.
