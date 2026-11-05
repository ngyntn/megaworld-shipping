"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/services/session";
import { rateError } from "@/features/rates/services/errors";
import type { ScheduleImportPreview, ScheduleImportResult } from "./types";
const MAX_BYTES = 2 * 1024 * 1024;
export async function previewScheduleImport(
  form: FormData,
): Promise<ScheduleImportResult<ScheduleImportPreview>> {
  const { pb } = await requireSession();
  try {
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      !/\.xlsx$/i.test(file.name) ||
      !file.size ||
      file.size > MAX_BYTES
    )
      return { error: "Chọn file .xlsx, tối đa 2 MiB và 500 dòng." };
    const data = await pb.send<ScheduleImportPreview>(
      "/api/megaworld/admin/schedule-imports/preview",
      {
        method: "POST",
        body: {
          file_name: file.name,
          file_base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
        },
      },
    );
    return { data };
  } catch (e) {
    return rateError(e);
  }
}
export async function commitScheduleImport(
  id: string,
): Promise<ScheduleImportResult<{ imported_rows: number }>> {
  const { pb } = await requireSession();
  if (!/^[a-z0-9]{15}$/.test(id)) return { error: "Mã import không hợp lệ." };
  try {
    const data = await pb.send<{ imported_rows: number }>(
      `/api/megaworld/admin/schedule-imports/${id}/commit`,
      { method: "POST", body: {} },
    );
    revalidatePath("/admin/schedules");
    revalidatePath("/admin/dashboard");
    return { data };
  } catch (e) {
    return rateError(e);
  }
}
