# Tích hợp frontend Next.js

Nguồn hợp đồng API: [xác thực và giá](api.md), [lịch tàu/tra cứu/Excel/dashboard](operations-api.md),
[phân quyền](access-control.md). Local dùng 8090; demo dùng 8091 và slug megaworld-demo.

## Luồng khách

1. Lấy slug từ route `/s/{slug}/...`, gọi storefront để lấy liên hệ và ngôn ngữ mặc định.
2. Đọc catalog ports/carriers/routes có phân trang để dựng bộ lọc; cảng lọc theo can_be_pol/can_be_pod.
3. Gọi rates với pol/pod hoặc route, carrier/container nếu có. Ghép items theo route/hãng để hiển thị
   các cột container trong thiết kế; ID series dùng cho popup lịch sử đúng loại container.
4. Hiển thị validity_status từ server; expired vẫn xuất hiện và ở sau valid. Không tự lưu cờ hết hạn.
5. Khi khách chủ động tra tuyến, gửi một sự kiện searches; không gửi lại do render/phân trang.
6. Compare yêu cầu cùng tuyến/container; schedules lọc theo khoảng ETD, export tải Blob XLSX.
7. Yêu thích ở localStorage, khóa bao gồm slug để không lẫn nhân viên. Báo giá dùng liên hệ storefront.

Public DTO không chứa giá gốc/lãi/ghi chú riêng. Không cache dữ liệu nhân viên tại CDN;
response custom đặt no-store. Giao diện vi/en/zh dịch nhãn riêng, không tự dịch giá hoặc ghi chú người dùng nhập.
API có thể trả một dòng theo container, không giả định cả 3 container luôn có giá.

## Luồng nhân viên

- Login staff, giữ phiên ở phía server Next.js bằng cookie HttpOnly/Secure theo kiến trúc khi làm frontend.
  Thao tác ghi phải có CSRF protection phù hợp; không đưa token superuser hoặc secret vào NEXT_PUBLIC_*.
- Tạo PocketBase client riêng cho mỗi request có authStore người dùng; gọi auth-refresh để xác minh token,
  không chỉ tin authStore.isValid hoặc tự đọc JWT mà bỏ kiểm tra server.
- Dùng services trong features; không gọi PocketBase trực tiếp từ component UI.
- Seed catalog một lần qua POST setup/catalog với token nhân viên; có thể gọi lại an toàn.
- Đọc giá riêng qua records API để có series/revision và rate_costs thuộc owner.
- Lưu giá qua custom API, tiền đổi USD→integer cents có kiểm tra; expected_revision dùng revision đã đọc.
  Khi 409, hiển thị yêu cầu tải lại dữ liệu; không tự ghi đè thay đổi của request khác.
- Nhân bản trả payload riêng, không ghi dữ liệu tới khi người dùng nhấn lưu.
- Sửa lịch tàu gửi payload đầy đủ và expected_revision; hủy bằng status=cancelled, không xóa.
- Import dùng File.arrayBuffer → base64, gửi preview và hiển thị các dòng lỗi; chỉ commit bằng job ID khi xác nhận.
  Không gửi lại payload giá từ trình duyệt khi commit. Job completed có thể gọi lại để lấy kết quả mà không nhập thêm.
- Dashboard dùng một endpoint tổng hợp, không tự ghép số liệu bằng cách tải bảng giá gốc xuống trình duyệt khách.

## Xử lý lỗi

| Mã | Hành vi giao diện |
|---|---|
| 400 | Hiển thị lỗi input; giữ dữ liệu form để sửa |
| 401/403 | Yêu cầu đăng nhập lại hoặc báo thao tác không được phép |
| 404 | Báo không tìm thấy dữ liệu/storefront, không đoán owner khác |
| 409 | Tải revision mới hoặc preview lại import, không tự retry ghi đè |
| 413 | Báo file/body quá lớn theo giới hạn API |
| 429 | Thông báo thử lại sau; không liên tục gửi request |
| 5xx | Hiển thị lỗi tạm thời, không đưa lỗi nội bộ vào giao diện |

Lấy items/page/per_page/has_more để phân trang. Không gửi expand/filter SQL tùy ý vào API công khai.
Các file Excel chỉ có lịch tàu hoặc template import; không có export giá cước/so sánh.
