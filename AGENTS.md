# Techstack bất buộc cho dự án:

Next.js, Tailwind CSS + custom, PocketBase

# Bắt buộc:

1. Giao diện phải giống y hệt thiết kế tại \docs\artifact
2. Cấu trúc thư mục code frontend tốt, tách component, quản li call api tốt. Không gom chung một file quá nhiều dòng code.


# Cấu trúc docs artifact

Thư mục `docs/artifact/` chứa các mockup giao diện tham chiếu, được chia theo vai trò và module. Đây là nguồn chuẩn để agent đối chiếu giao diện khi triển khai; không dùng nguyên HTML mockup làm code production. Yêu cầu nghiệp vụ tổng thể nằm trong [`docs/srs.md`](docs/srs.md).

## Bản đồ màn hình

```text
docs/artifact/
├── AD - M1 - Đăng nhập - dashboard/
│   ├── A1. Đăng nhập Admin-html/                 # Đăng nhập quản trị
│   └── A2. Dashboard-html/                       # Tổng quan quản trị
├── AD - M2 - Quản lý giá cước/
│   ├── A3. Quản lý giá cước-html/                # Danh sách giá cước
│   ├── A4. Thêm sửa dòng giá-html/               # Tạo/sửa một dòng giá
│   └── A5. Import Excel-html/                    # Nhập giá từ Excel
├── AD - M3 - Lịch tàu - danh mục - tài khoản/
│   ├── A6. Quản lý lịch tàu-html/                # Quản trị lịch tàu
│   ├── A7. Hãng tàu & cảng-html/                 # Danh mục hãng tàu và cảng
│   └── A8. Tài khoản & cài đặt-html/             # Tài khoản/cài đặt admin
├── KH - M1 - Tra giá - lịch sử giá - liên hệ/
│   ├── 1. Tra giá cước-html/                      # Tra cứu giá công khai
│   ├── 2. Lịch sử giá (popup)-html/               # Popup lịch sử giá
│   └── 7. Yêu cầu báo giá (popup)-html/           # Popup thông tin liên hệ/báo giá
├── KH - M2 - Lịch tàu - so sánh giá/
│   ├── 3. Lịch tàu-html/                          # Tra cứu lịch tàu
│   └── 4. So sánh giá-html/                       # So sánh giá giữa các hãng
└── KH - M3 - Tuyến yêu thích/
    └── 6. Tuyến yêu thích-html/                   # Các tuyến khách đã lưu
```


# Frontend codebase tree

```text
src/
├── app/                              # Route, layout và page của Next.js
│   ├── (public)/                     # Các trang khách không cần đăng nhập
│   │   ├── rates/                    # Tra giá, lịch sử giá
│   │   ├── schedules/                # Lịch tàu, so sánh giá
│   │   └── favorites/                # Tuyến yêu thích
│   ├── admin/                        # Khu vực quản trị, cần bảo vệ quyền truy cập
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── rates/
│   │   ├── schedules/
│   │   ├── master-data/              # Hãng tàu, cảng
│   │   └── settings/
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Tailwind và style nền tảng
├── components/                       # Component dùng chung nhiều tính năng
│   ├── ui/                           # Button, Input, Dialog, Table...
│   ├── layout/                       # Header, sidebar, navigation
│   └── feedback/                     # Loading, empty state, error state
├── features/                         # Mã riêng theo nghiệp vụ/tính năng
│   ├── rates/
│   │   ├── components/               # Bảng giá, bộ lọc, form giá
│   │   ├── hooks/                    # Hook phối hợp state và thao tác UI
│   │   ├── services/                 # Hàm gọi API của tính năng
│   │   ├── schemas/                  # Validate input (ví dụ Zod)
│   │   ├── types.ts                  # Kiểu dữ liệu riêng của tính năng
│   │   └── utils.ts                  # Xử lý thuần chỉ dùng trong tính năng
│   ├── schedules/
│   ├── favorites/
│   ├── auth/
│   └── ...                           # Các nghiệp vụ khác theo cùng quy ước
├── lib/                              # Cấu hình và hạ tầng dùng chung
│   ├── pocketbase/
│   │   ├── client.ts                 # Khởi tạo PocketBase phía trình duyệt
│   │   └── server.ts                 # Khởi tạo PocketBase phía server nếu cần
│   ├── env.ts                        # Đọc/kiểm tra biến môi trường
│   └── utils.ts                      # Hàm tiện ích dùng chung
├── types/                            # Kiểu dùng chung giữa nhiều tính năng
└── styles/                           # Token/style toàn cục bổ sung nếu cần

public/                               # Ảnh, logo, font và tài sản tĩnh
```

## Quy tắc phân chia code

- `app/` chỉ quản lý route, layout và ghép tính năng; giữ `page.tsx` gọn.
- Tổ chức code theo `features/<feature>/`; mỗi tính năng tự quản lý component, hook, service, schema và type.
- Chỉ đặt code dùng chung trong `components/`, `lib/` và `types/`.
- Component lo UI, hook lo state, service lo dữ liệu. Không gọi PocketBase trực tiếp trong component.
- Giữ mỗi file gọn, rõ trách nhiệm; không gom cả trang và nghiệp vụ vào một file.
- Bảo vệ thao tác Admin phía server; không để khóa bí mật trong `NEXT_PUBLIC_*`.
- Dùng tên file, thư mục tiếng Anh nhất quán.

