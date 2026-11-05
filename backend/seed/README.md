# Dữ liệu khởi tạo

15 hãng theo SRS, logo PNG mock (chữ viết tắt; không phải logo thương hiệu), 6 POL và 73 POD.
Catalog được sao chép riêng theo owner, chạy lại không ghi đè dữ liệu nhân viên đã chỉnh.
Không tự tạo tất cả tuyến, không tạo tài khoản hoặc giá thị trường trong seed catalog.

`ports.csv` dùng dấu `|`. `code` là mã nội bộ dùng cho filter/import, **không đồng nghĩa với UN/LOCODE**.
Chỉ `unlocode` được coi là mã đã đối chiếu: VNCLI, VNTOT và VNHPH có trong
[danh sách Việt Nam của UNECE](https://service.unece.org/trade/locode/vn.htm), bản dữ liệu hiển thị 2024-2,
đối chiếu ngày 04/11/2026. Vì vậy Cái Mép dùng VNTOT trong trường chính thức, không dùng mã VNCMT của mockup.
Các trường unlocode trống vẫn cần đối chiếu theo [nguồn UNECE](https://unece.org/trade/cefact/unlocode-code-list-country-and-territory)
trước khi dùng trên chứng từ hoặc tích hợp hãng tàu. Không suy ra mã chính thức từ code nội bộ.
Tên vi/en/zh trong giao diện có thể bổ sung sau; POD dùng tên cảng quốc tế, không tự dịch tên riêng.

Demo nằm trong database local riêng, giá và lịch tàu đều giả lập và được đánh dấu DEMO.
Demo không xuất bản dữ liệu vào database dùng thật. Xem [hướng dẫn dữ liệu](../../docs/backend/seed-data.md).
