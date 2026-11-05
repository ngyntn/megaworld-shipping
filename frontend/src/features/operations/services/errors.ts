import { ClientResponseError } from "pocketbase";
export function operationError(e: unknown) {
  if (e instanceof ClientResponseError) {
    if (e.status === 409)
      return {
        error:
          "Dữ liệu đã thay đổi. Tải lại trang trước khi lưu để tránh ghi đè.",
      };
    if (e.status === 400) {
      const details = [
        ...new Set(
          Object.values(e.response?.data || {}).map(
            (value) => (value as { message?: string }).message || "Không hợp lệ",
          ),
        ),
      ].join(" · ");
      return {
        error:
          details ||
          "Dữ liệu chưa hợp lệ. Kiểm tra thông tin, ngày và danh mục đang hoạt động.",
      };
    }
    if ([401, 403].includes(e.status))
      return { error: "Phiên đăng nhập hết hạn hoặc không có quyền thao tác." };
    if (e.status === 429)
      return { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." };
    return { error: "Không thể thực hiện thao tác. Vui lòng thử lại." };
  }
  return {
    error: e instanceof Error ? e.message : "Không thể thực hiện thao tác.",
  };
}
