# Kiểm tra Admin module 2

Ngày 04/11/2026. Chrome DevTools kiểm tra với database PocketBase tạm và production frontend cổng 3002 qua `scripts/qa-session.py`. Dữ liệu chính và demo hiện có không bị sửa.

## Kết quả

- `npm test`: 4 kiểm tra qua; quy đổi USD thành cents chính xác, nhận giá 0, chặn âm/sai định dạng/quá 2 chữ số thập phân/vượt giới hạn, ngày không tồn tại, container trùng và revision âm.
- `npm run typecheck` và `npm run build`: qua.
- Route chưa có phiên chuyển về login; các thao tác ghi xác minh staff phía server.
- Kiểm tra đọc trên demo hiện có sau khi hoàn thiện: form sửa nạp cùng lúc 20GP/40GP cùng hàng và giữ đúng một lịch tàu đang liên kết; không ghi thay đổi vào demo.
- Sửa 40HC từ giá gốc 1.000,50 + lãi 100 thành 1.100,25 + 125,75: backend ghi đúng 122600 cents ở revision 2, revision 1 trở thành lịch sử. Phụ phí ghép và lưu đúng.
- Mở form revision 2, ghi revision 3 từ phiên khác rồi lưu form cũ: backend trả 409; UI giữ giá đang nhập, hiện yêu cầu tải lại và khóa hai nút lưu.
- Nhân bản revision cũ nạp đúng giá nguồn và revision đích hiện tại, không ghi dữ liệu trước khi nhấn lưu. “Lưu & nhân bản tiếp” tạo giá mới rồi mở form nhân bản tiếp với thông báo thành công; đã lưu thêm container mới, gồm giá 0 USD và giá có cents.
- Lịch sử hiển thị đủ 5 revision của một chuỗi giá và đánh dấu đúng bản hiện hành.
- Import `mixed.xlsx`: preview có 1 dòng mới + 1 dòng thay giá + 1 dòng lỗi; số phiên bản trước xác nhận vẫn là 3. Nhấn nhập ghi đúng 2 dòng, tổng phiên bản thành 5. Xác nhận lại cùng job trả kết quả cũ và số phiên bản vẫn là 5.
- Import file chỉ có dòng lỗi: nút nhập bị khóa.
- Tải template: HTTP 200, MIME XLSX, tên attachment đúng, nhận workbook thật.
- Ẩn giá gốc xóa các nhãn giá gốc/lợi nhuận khỏi bảng. Tìm kiếm không khớp trả bảng trống. Lịch sử 31 dòng được phân trang; yêu cầu trang 999 được giới hạn về trang 2.
- Danh sách, form và import không tràn ngang ở 390×844; bảng nhiều cột cuộn bên trong. Không có lỗi/warning console trong các luồng đã kiểm tra.

## Đối chiếu thiết kế

Tham chiếu A3/A4/A5 trong `docs/artifact/AD - M2 - Quản lý giá cước/`. Giữ font Inter, sidebar/header, màu nền/navy, banner bảo mật, tab, bảng giá cuộn ngang, form rộng 760px và thẻ import tối đa 820px. Đã kiểm tra hình ảnh và kích thước bằng Chrome DevTools; chưa thực hiện pixel diff để khẳng định tỷ lệ 99%.

Khác biệt theo hợp đồng API: 45HC chỉ hiển thị “—”; lợi nhuận tuyến lấy cấu hình, không sửa cấu hình ngay trong form giá; backend trả metadata hạn chế cho dòng import lỗi nên các ô không có dữ liệu để “—”. Các con số, ngày, hãng/tuyến phụ thuộc tài khoản đang đăng nhập.
