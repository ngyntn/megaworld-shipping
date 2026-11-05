# Admin module 3

Triển khai Next.js + Tailwind/custom CSS, đối chiếu A6/A7/A8 trong `docs/artifact/AD - M3 - Lịch tàu - danh mục - tài khoản/`.

## Trang và tích hợp

- `/admin/schedules`: nhập chuyến, lưu & thêm tiếp, sửa, hủy, lọc POL/tháng/trạng thái, phân trang. Dùng custom API `/api/megaworld/admin/schedules`; gửi revision đã đọc khi sửa/hủy. Tự tạo route theo POL/POD nếu chưa tồn tại. Backend tính transit time; giao diện hiển thị bản tính trước từ ngày nhập.
- `/admin/master-data`: danh sách hãng/cảng, tìm kiếm, thêm/sửa, bật/tắt hiển thị, tải logo. Dùng records API theo quyền owner. Cột dòng giá đếm các `rate_series` theo hãng, không đếm phiên bản lịch sử.
- `/admin/settings`: cập nhật hồ sơ/email, đổi mật khẩu, liên hệ storefront, lợi nhuận mặc định, cảnh báo và ngôn ngữ. Đổi email yêu cầu mật khẩu hiện tại; đổi mật khẩu cập nhật lại cookie phiên HttpOnly.

Mỗi route và server action xác thực lại tài khoản staff active. Không dùng superuser. Component không gọi PocketBase; dữ liệu được lấy qua services/server actions và hook điều phối UI.

## Đối chiếu với hợp đồng backend

- Import Excel lịch tàu là tính năng tương lai, nút giữ trạng thái “Sắp có”.
- Hủy chuyến dùng `status=cancelled`, giữ lịch sử; không xóa record.
- Backend không có thời gian đăng nhập gần nhất hoặc thời gian cập nhật trong DTO lịch tàu. Hồ sơ hiển thị “Chưa có dữ liệu”; bảng chuyến dùng trạng thái thực thay cho cột cập nhật mẫu.
- Backend logo hỗ trợ PNG/JPEG/WebP, không hỗ trợ SVG. Giao diện giới hạn 200 KB như thiết kế.
- Tìm kiếm lịch tàu áp dụng trong trang kết quả hiện tại, có chú thích; bộ lọc POL/tháng/trạng thái và phân trang chạy phía server.
- Nếu chưa có storefront, form liên hệ yêu cầu tên/slug, tạo ở trạng thái chưa xuất bản để người vận hành cấu hình trước.

## Kiểm chứng ngày 04/11/2026

- `npm run build`, `npm run typecheck`, `npm test`: đạt.
- Chromium thực với backend demo 8091: mở đủ ba trang, không có lỗi JavaScript; kiểm tra chiều rộng 390px không tràn viewport.
- Đã kiểm tra lưu/sửa chuyến và hủy chuyến, thay đổi cờ hiển thị danh mục, tab cảng, lưu hồ sơ, lưu liên hệ, lưu lợi nhuận 151.25 USD thành 15125 cents, từ chối mật khẩu nhập lại sai, đổi mật khẩu thành công và duy trì phiên.
- Dữ liệu demo đã sửa khi kiểm tra được khôi phục; revision lịch tàu tăng theo hợp đồng backend.
- Ảnh đối chiếu mockup và ảnh desktop/mobile kiểm tra nằm trong `frontend/.verification/` (local, gitignored). Chrome DevTools MCP bị lỗi trùng profile; dùng Chromium qua Playwright cho kiểm tra này.
