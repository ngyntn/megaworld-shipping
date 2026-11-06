import type { ExportKind, ExportRequest } from "../types";

export async function downloadExcel(kind: ExportKind, request: ExportRequest) {
  const response = await fetch(`/admin/${kind}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error || "Không thể xuất Excel. Vui lòng thử lại.");
  }
  if (!response.headers.get("Content-Type")?.includes("spreadsheetml")) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  const blob = await response.blob();
  const filename = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || `${kind}.xlsx`;
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
