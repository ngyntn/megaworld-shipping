
# Megaworld Shipping

Website tra cứu giá cước xuất khẩu đường biển; stack dự kiến Next.js, Tailwind CSS và PocketBase.

- [Yêu cầu nghiệp vụ](docs/srs.md)
- [Mẫu giao diện](docs/artifact/)
- [Khởi động backend PocketBase](backend/README.md)
- [Quy tắc nghiệp vụ backend](docs/backend/business-rules.md)
- [Thiết kế database](docs/backend/database.md)

Backend đã có schema, phân quyền, giá có lịch sử, lịch tàu, tra cứu/so sánh,
import Excel giá cước, tải Excel lịch tàu, dashboard, seed và demo riêng.
Xem [API](docs/backend/api.md) và [phân quyền](docs/backend/access-control.md).
Xem thêm [API lịch tàu, tra cứu, import và dashboard](docs/backend/operations-api.md).
Xem [dữ liệu ban đầu/demo](docs/backend/seed-data.md), [kiểm thử](docs/backend/verification.md),
[tích hợp frontend](docs/backend/frontend-integration.md) và [triển khai/backup](docs/backend/deployment.md).
Cấu hình triển khai đã chuẩn bị; chưa đưa lên VPS/domain.

Frontend Admin module 1 và 2 đã có đăng nhập, dashboard, quản lý giá, thêm/sửa/nhân bản, lịch sử và import Excel tích hợp PocketBase.
Xem [hướng dẫn chạy frontend](frontend/README.md), [kiểm tra module 1](frontend/VERIFICATION.md) và [kiểm tra module 2](frontend/VERIFICATION-M2.md).
