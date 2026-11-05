import { requireSession } from "@/features/auth/services/session";
import { pocketbaseUrl } from "@/lib/env";
export async function GET() {
  const { pb } = await requireSession();
  try {
    const response = await fetch(
      `${pocketbaseUrl}/api/megaworld/admin/imports/template`,
      { headers: { Authorization: pb.authStore.token }, cache: "no-store" },
    );
    if (!response.ok)
      return new Response("Không thể tải file mẫu. Vui lòng thử lại.", {
        status: response.status,
      });
    return new Response(response.body, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="rates-import-template.xlsx"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Không thể kết nối máy chủ.", { status: 502 });
  }
}
