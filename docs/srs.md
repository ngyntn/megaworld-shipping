## 1. Bản mô tả yêu cầu

**Mục tiêu:** website tra cứu giá cước xuất khẩu đường biển. Khách hàng tự tra giá, lịch tàu và so sánh giá mà không phải chờ nhân viên gửi. Nhân viên báo giá cập nhật dữ liệu nhanh và không còn nhầm giá cũ.

**Vai trò**
- **Khách (không cần đăng nhập):** chỉ xem.
- **Admin (nhân viên báo giá):** đăng nhập, quản lý toàn bộ dữ liệu. Mỗi tài khoản này sẽ tương ứng với một người nhân viên báo giá, mỗi người sẽ có hãng tàu, cảng, báo giá, lịch tàu đều khác nhau. Do đó dữ liệu sẽ đi theo nhân viên, không ai dùng chung với ai cái gì.

**Phạm vi nghiệp vụ**
- Chỉ hàng xuất. **POL:** các cảng khu vực TP.HCM, Vũng Tàu (Cái Mép, Thị Vải) và Hải Phòng. **POD:** các cảng trên thế giới.
- Giá tính bằng **USD**, không quy đổi VND.
- 15 hãng: ONE, MSC, EMC, CMA CGM, TSL, IAL, WHL, YML, SML, NSS, KMTC, SNK, COSCO, MSK, SNL.

**Chức năng cho khách (giao diện 3 ngôn ngữ ngữ Việt/Anh/Trung, dùng tốt trên điện thoại)**
1. **Tra giá cước:** lọc theo POL, POD, loại container (20GP, 40GP, 40HC) và hãng.
   - Mỗi dòng gồm giá từng loại container, phí local, ghi chú, validity, transit time, direct/transit.
   - Giá hết hạn vẫn hiện nhưng đánh dấu đỏ "Hết hạn" và xếp sau giá còn hạn.
2. **Lịch sử giá:** ở mỗi dòng giá có nút xem giá các đợt trước của cùng tuyến, hãng, container (không biểu đồ). Hiện giá cũ, giá mới, chênh lệch tăng giảm, validity và lịch tàu tương ứng.
3. **Lịch tàu:** chọn POL, POD, khoảng ngày thì thấy tất cả hãng chạy tuyến đó (hãng, tàu (hiẻn thị tàu + chuyến nên không cần cột chuyến), ETD, ETA, transit time, direct/transit). Có nút tải file Excel.
4. **So sánh giá:** cùng một tuyến, các hãng xếp cạnh nhau, sắp xếp theo giá, transit time hoặc ngày tàu gần nhất. Chỉ xem trên màn hình, không xuất file.
5. **Tuyến yêu thích:** lưu trên trình duyệt của khách (không cần tài khoản).
6. **Liên hệ báo giá:** nút "Yêu cầu báo giá" dẫn sang Zalo/điện thoại/email của nhân viên, vì khách vẫn chốt giao dịch ngoài hệ thống.

**Chức năng cho Admin**
1. **Quản lý giá cước:** thêm, sửa, nhân bản dòng giá cũ rồi chỉnh, import Excel, nhập từng dòng.
2. **Giá gốc và giá bán:** nhập giá gốc từ sếp và lợi nhuận theo từng tuyến (hoặc từng dòng), hệ thống tính ra giá bán. Khách chỉ thấy giá bán.
3. **Quản lý lịch tàu:** nhập tay và import Excel (chức năng tương lai).
4. **Quản lý hãng tàu, cảng, logo.**
5. **Dashboard:** giá mới cập nhật, tuyến được tra nhiều nhất, giá biến động lớn (theo valid).
6. **Ghi chú nội bộ** cho từng dòng giá (khách không thấy).

**Quy tắc nghiệp vụ**
- Cập nhật giá cho cùng tuyến, hãng, container thì giá cũ thành lịch sử, giá mới là giá hiện hành. Không xóa dữ liệu cũ.
- Giá hết hạn tự đổi trạng thái theo ngày, không cần nhân viên thao tác.
- **Giá gốc tuyệt đối không được lộ ra ngoài.** PocketBase phân quyền theo bảng chứ không theo từng cột, nên giá gốc và lợi nhuận phải nằm ở **bảng riêng chỉ Admin truy cập được**.

**Phi chức năng**
- Tải nhanh

**Ngoài phạm vi (không làm):** tự động lấy lịch tàu từ web các hãng, biểu đồ giá, xuất PDF/Excel giá, tỷ giá VND, đăng nhập cho khách, hàng nhập và tuyến giữa các nước khác, tạo báo giá PDF và theo dõi trạng thái báo giá.

**Dữ liệu ban đầu cần chuẩn bị**
- 15 hãng tàu với tên đầy đủ kèm logo (nếu không có logo thì mock)
- POL: Cát Lái, Cái Mép, Thị Vải, Hải Phòng (kèm Lạch Huyện, Đình Vũ).
- POD: khoảng 60-80 cảng lớn theo khu vực (Mỹ, Canada, châu Âu, Đông Á, Đông Nam Á, Trung Đông, Ấn Độ, Úc). Mã UN/LOCODE mình cần đối chiếu lại trước khi dùng thật.

## 3. Đề xuất MVP

**Mục tiêu MVP:** nhân viên cập nhật được giá và lịch tàu, khách tra được giá và lịch tàu trên điện thoại.

| Có trong MVP | 
|---|
| Trang tra giá cước + bộ lọc |
| Trạng thái hết hạn (đỏ) |
| Xem giá trước/sau (lịch sử) |
| Lịch tàu + tải Excel |
| So sánh giá giữa các hãng |
| Admin: đăng nhập, nhập tay, nhân bản dòng |
| Giá gốc/lợi nhuận/giá bán, ẩn giá gốc |
| Danh sách hãng tàu và cảng cơ bản |
| Nút liên hệ Zalo/điện thoại |
| 3 ngôn ngữ Việt, Anh, Trung |