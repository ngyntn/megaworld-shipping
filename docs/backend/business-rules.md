# Quy tắc nghiệp vụ backend

Nguồn chính: [SRS](../srs.md). Màn hình trong [artifact](../artifact/) bổ sung trường dữ liệu.
Tài liệu phản ánh backend đã triển khai tới bước 12 (cấu hình hosting mới chuẩn bị, chưa deploy).

## Phạm vi và chủ sở hữu

- Khách không đăng nhập; chỉ tra cứu dữ liệu công khai và liên hệ ngoài hệ thống.
- Nhân viên báo giá là tài khoản `staff`, không phải PocketBase `_superusers`.
- Mỗi nhân viên sở hữu độc lập hãng tàu, cảng, tuyến, giá, lịch tàu và cài đặt.
- Không dùng chung bản ghi danh mục. Dữ liệu mẫu sau này được sao chép riêng cho từng nhân viên.
- Chỉ hỗ trợ hàng xuất từ các POL thuộc phạm vi SRS; giá dùng USD.
- Tài khoản do người vận hành tạo; không có đăng ký công khai.

## Cách xác định nhân viên cho khách

SRS chưa quy định cách khách chọn nhân viên. Quy ước thiết kế: mỗi nhân viên có một `storefronts.slug`
duy nhất, ví dụ `/s/nguyen-an/rates`. Các trang giá, lịch tàu, so sánh, liên hệ và yêu thích đều gắn
với slug này. Đây là quy ước để có thể triển khai tiếp, chưa tạo route frontend trong bước này.

Slug công khai không phải thông tin xác thực. API khách cần tra storefront đã xuất bản và tài khoản
đang hoạt động rồi giới hạn dữ liệu theo owner tương ứng. Không gom dữ liệu nhiều nhân viên.
Nhân viên khác vẫn có thể xem trang công khai như khách; quyền quản trị và dữ liệu riêng vẫn cách ly.
`staff` không được mở công khai; email đăng nhập tách khỏi email liên hệ trong `storefronts`.

## Giá và lịch sử

- Khóa chuỗi giá: **nhân viên + tuyến POL/POD + hãng tàu + loại container**.
- Một `rate_series` đại diện cho khóa đó. Mỗi lần lưu giá tạo một `rate_versions` mới.
- Bảng giao diện có nhiều cột container; API sau này ghép các chuỗi giá cùng tuyến/hãng thành một dòng.
- Không có giá cho loại container nào thì không tạo phiên bản giá cho loại đó; hiển thị “—”.
  Giá 0 USD là giá trị thực, không đại diện cho ô trống.
- Giá bán = giá gốc + lợi nhuận. Lợi nhuận là số USD cố định/container theo mockup, không phải phần trăm.
- Thứ tự chọn lợi nhuận: giá trị từng dòng → giá trị tuyến → mặc định nhân viên.
  Khi chọn chế độ tuyến, cùng một khoản lãi được áp dụng cho các loại container trong lần lưu đó.
- Tiền lưu bằng integer cents: 1.950,50 USD → `195050`. Không dùng float để tính tiền.
- Giá gốc, khoản lãi và ghi chú nội bộ chỉ nằm trong `rate_costs`; mặc định lãi ở `staff_settings`
  và `route_margins` cũng là dữ liệu riêng. Không đưa các trường này vào phản hồi công khai, export hay log.
- Phụ phí/local lưu mô tả riêng như mẫu; chưa tự cộng vào giá bán để tránh diễn giải sai đơn vị tính.
- Mỗi chuỗi có tối đa một phiên bản `is_current=true`, được bảo vệ bằng unique index có điều kiện.
- “Hiện hành” là phiên bản mới nhất được lưu, không đồng nghĩa “còn hạn”. Lưu giá tương lai có thể khiến
  giá hiện hành ở trạng thái “chưa hiệu lực”; không tự quay lại phiên bản cũ.
- Trong một lần lưu nhiều container, tạo phiên bản, giá riêng, liên kết lịch tàu và chuyển cờ hiện hành
  phải nằm trong cùng transaction. Bản lịch sử không sửa nội dung, không xóa qua API nghiệp vụ.
- Nhân bản chỉ chuẩn bị đầu vào mới; lưu mới tạo phiên bản. Thay đổi mặc định lãi không đổi giá đã lưu.
- Lịch sử so sánh hai revision liên tiếp trong cùng chuỗi; giữ cả validity và snapshot lịch tàu lúc lưu.

## Ngày và lịch tàu

- Validity lưu ngày lịch dạng `YYYY-MM-DD`, tính cả ngày bắt đầu và kết thúc.
- Theo ngày hiện tại tại `Asia/Ho_Chi_Minh`: trước `valid_from` là chưa hiệu lực;
  trong khoảng là còn hạn; sau `valid_to` là hết hạn.
- Không lưu cờ `expired` dễ bị lỗi thời. Trạng thái tính lúc đọc, không cần cron đổi trạng thái mỗi ngày.
- Tra giá: giá còn hạn trước, hết hạn sau; giá chưa hiệu lực phải có nhãn riêng.
  So sánh giá chỉ lấy giá hiện hành còn hạn, đúng mô tả màn hình Compare.
- ETD/ETA hiện lưu ngày lịch, chưa bao gồm giờ hoặc múi giờ cảng. ETA phải không trước ETD;
  transit time lịch tàu tính bằng chênh lệch số ngày. Transit time báo giá là ước tính riêng.
- `scheduled`/`cancelled` lưu trạng thái nghiệp vụ; “sắp chạy/đã chạy” suy ra từ ETD.
- Mỗi phiên bản giá liên kết các chuyến phù hợp cùng owner, tuyến, hãng; snapshot giữ tàu, chuyến,
  ETD, ETA và dịch vụ tại thời điểm lưu để sửa lịch tàu không làm đổi lịch sử.
- Chỉ lịch tàu có tải Excel. Không xuất Excel/PDF giá cước và so sánh.

## Tính năng còn lại

- Yêu thích lưu tại trình duyệt, khóa dữ liệu bao gồm slug nhân viên; không có collection khách/yêu thích.
- Nút báo giá dùng điện thoại, Zalo hoặc email của storefront; không tạo quy trình giao dịch/báo giá PDF.
- Giao diện hỗ trợ vi/en/zh. Danh mục có tên dịch tùy chọn; ghi chú do nhân viên nhập không tự dịch.
- Dashboard tổng hợp giá mới, biến động giữa revision và lượt tra theo tuyến trong ngày.
- `search_daily_stats` chỉ lưu số đếm, không thu thập IP hay danh tính khách.
- Import giá Excel sử dụng cùng quy tắc lưu giá. Import lịch tàu là tính năng tương lai.

## Khác biệt giữa SRS và artifact

| Điểm | Quyết định cho thiết kế ban đầu |
|---|---|
| Mockup có 45HC, SRS chỉ 20GP/40GP/40HC | Schema hiện chỉ nhận 3 loại theo SRS; bổ sung 45HC bằng migration nếu mở rộng phạm vi. |
| Mockup có điều kiện FOB/CIF và loại hàng GC/RF/DG | Có trường metadata tùy chọn; chưa thêm vào khóa phân biệt chuỗi giá của SRS. |
| Tên/mã cảng trong mẫu | Không coi là UN/LOCODE đã xác minh; `code` nội bộ tách khỏi `unlocode` chính thức. |
| Lợi nhuận âm | Chưa hỗ trợ trong thiết kế ban đầu; tiền gốc, lãi, giá bán đều không âm. |

## Trạng thái triển khai

Đã có rules theo owner, cấm đổi owner, kiểm tra relation cùng owner, tài khoản active và storefront published.
Nhân viên không sửa/xóa giá trực tiếp; custom API lưu giá bằng transaction, kiểm tra ngày lịch và thứ tự ngày,
tính giá, tạo snapshot, kiểm soát sửa đồng thời bằng expected_revision. API giá hiện hành/lịch sử chỉ trả
danh sách trường được phép; trạng thái hết hạn tính khi đọc theo ngày Việt Nam, sắp sau giá còn hiệu lực.

Khi nhập qua API, `margin_mode` chọn `row`, `route` hoặc `default`. Row yêu cầu margin_cents;
route dùng cấu hình tuyến, nếu chưa có thì dùng mặc định nhân viên; default dùng mặc định trực tiếp.
Thiếu cấu hình mặc định trong chế độ cần dùng thì từ chối, không ngầm coi lợi nhuận bằng 0.
Container không gửi trong lần lưu giữ nguyên giá hiện hành; không xóa ngầm giá cũ khi bỏ trống ô.

Chưa có frontend Next.js nên chưa có cookie/middleware Next.js; xác thực và quyền được kiểm tra tại PocketBase.
Đã có API tạo/sửa/hủy lịch tàu, catalog và bộ lọc giá/lịch tàu, so sánh giá còn hiệu lực,
tải XLSX lịch tàu, import XLSX giá qua preview/commit và dashboard. Realtime ứng dụng hiện bị khóa;
chỉ superuser dashboard được đăng ký realtime. Đã có seed catalog theo nhân viên và demo riêng;
chưa có UI ba ngôn ngữ hoặc hosting thực. Cấu hình triển khai/backup đã chuẩn bị.

Import tuân theo mockup: dòng lỗi báo theo số dòng và bỏ qua khi xác nhận; các dòng hợp lệ được nhập
cùng transaction. Nếu giá thay đổi sau preview, commit trả 409 và không nhập dòng nào.
Preview hết hạn sau 24 giờ, job đã hoàn tất được trả lại kết quả mà không tạo revision thêm.
Trong một file không có hai dòng cùng tuyến/hãng/container; dòng trùng sau báo lỗi.

Lượt tra được ghi bằng POST sự kiện khi khách thực hiện tìm kiếm tuyến, không tự tăng khi GET/phân trang.
Đây là số hành động tra cứu, không phải số người dùng duy nhất. Không lưu thông tin định danh khách.
Dashboard tính giá biến động lớn từ giá hiện hành và revision liền trước, ngưỡng 10%; giá cũ bằng 0
và giá mới lớn hơn 0 có change_percent=null. Các thống kê giá tính theo từng loại container.
