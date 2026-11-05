# Admin frontend

Next.js App Router, Tailwind CSS, PocketBase. Yêu cầu Node.js 24+ cho lệnh kiểm thử TypeScript tích hợp.

Các màn hình đã có:

- Module 1: `/admin/login`, `/admin/dashboard`.
- Module 2: `/admin/rates`, `/admin/rates/new`, `/admin/rates/{versionId}/edit`, `/admin/rates/import`, `/admin/rates/history/{seriesId}`.

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Backend mặc định `http://127.0.0.1:8090`. Để dùng demo riêng, đặt `POCKETBASE_URL=http://127.0.0.1:8091` trong `.env.local`, rồi chạy `python backend/scripts/demo.py serve` từ thư mục gốc. Dùng tài khoản trong `backend/.demo-credentials.json`; không commit thông tin này.

Frontend: http://127.0.0.1:3000/admin/login.

`npm test` kiểm tra quy đổi tiền, giới hạn giá và validate ngày/container. `npm run typecheck` kiểm tra TypeScript; `npm run build` tạo production build.

Phiên staff nằm trong cookie HttpOnly, SameSite=Lax, Secure khi production. Server Actions kiểm tra Origin của thao tác POST theo Next.js. Mỗi request tạo PocketBase client riêng và xác minh phiên bằng auth-refresh. Không dùng tài khoản superuser. “Ghi nhớ đăng nhập” giữ cookie đến hạn token; bỏ chọn dùng session cookie. Quên mật khẩu hướng dẫn liên hệ quản trị viên, theo quy trình tài khoản hiện có.

Dashboard dùng endpoint tổng hợp, hỗ trợ lọc các hàng đang hiển thị và xem tối đa 5 cảnh báo sắp hết hạn từ API. Số ở chuông là số cảnh báo được trả về, không phải tổng số toàn bộ giá sắp hết hạn. Giá từ API là cents, hiển thị USD. Ngày dùng múi giờ Việt Nam.

Danh sách giá đọc records API riêng của staff, có lọc POL/POD/hãng/validity/tìm kiếm, phân trang 24 dòng container và đếm tab phía server. Các container cùng thông tin giá, revision và lịch tàu được ghép trên trang thành một hàng. Sửa/nhân bản nạp các container tương thích của hàng đó. Checkbox chỉ chọn hàng trong trang, chưa có thao tác hàng loạt vì API không hỗ trợ.

Form gửi giá gốc và lợi nhuận bằng integer cents, giá bán do backend tính. Lãi theo tuyến/mặc định đọc cấu hình hiện có; chọn “Theo từng dòng” để ghi lãi riêng. Để trống giá gốc không xóa giá đã có. Revision được giữ từ lúc đọc; gặp 409 cần tải lại. Sửa giữ các lịch tàu đã liên kết; nhân bản bỏ liên kết lịch tàu. Tuyến/hãng cần tồn tại và hoạt động trong danh mục. Cột 45HC giữ theo mẫu nhưng chưa nhập được vì API chỉ hỗ trợ 20GP/40GP/40HC.

Import hỗ trợ XLSX tối đa 2 MiB/500 dòng, tải template qua route server được bảo vệ, preview rồi xác nhận bằng job ID. Có thể nhập các dòng hợp lệ và bỏ qua dòng lỗi. Dòng lỗi hiển thị số dòng và thông báo do backend trả; các ô thiếu dữ liệu được để “—”. Body limit Server Actions là 3 MiB. Không có export giá cước.

Để kiểm tra các luồng ghi trên database tạm, sau `npm run build` chạy `python frontend/scripts/qa-session.py` từ thư mục gốc. Script tạo backend riêng và production frontend ở cổng 3002, file XLSX và thông tin tài khoản trong `frontend/.qa/` được bỏ qua Git. Tạo file `frontend/.qa/stop` để dừng và xóa database tạm. Không chạy build mới trong khi dùng phiên QA đang chạy.

Các liên kết module 3 và trang khách được giữ theo điều hướng thiết kế; các màn hình đó chưa triển khai.
