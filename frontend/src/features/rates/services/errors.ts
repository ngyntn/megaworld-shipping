import { ClientResponseError } from "pocketbase";
export function rateError(error: unknown) {
  if (error instanceof ClientResponseError) {
    if (error.status === 409)
      return {
        error:
          "Dữ liệu đã thay đổi hoặc bản xem trước đã hết hạn. Tải lại dữ liệu trước khi xác nhận.",
        conflict: true,
      };
    if (error.status === 400)
      return {
        error:
          "Dữ liệu chưa hợp lệ. Kiểm tra ngày hiệu lực, cấu hình lợi nhuận, tuyến và lịch tàu.",
      };
    if ([401, 403].includes(error.status))
      return {
        error:
          "Phiên đăng nhập hết hạn hoặc bạn không có quyền thao tác. Vui lòng đăng nhập lại.",
      };
    if (error.status === 404)
      return { error: "Không tìm thấy dữ liệu trong tài khoản của bạn." };
    if (error.status === 413)
      return { error: "Dữ liệu hoặc file vượt giới hạn cho phép." };
    if (error.status === 429)
      return { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." };
    return { error: "Không thể kết nối máy chủ. Vui lòng thử lại sau." };
  }
  return {
    error:
      error instanceof Error ? error.message : "Không thể thực hiện thao tác.",
  };
}
