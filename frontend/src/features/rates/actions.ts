"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/services/session";
import { getTarget } from "./services/queries";
import { validateRateInput } from "./schemas/rate-input";
import { rateError } from "./services/errors";
import { getCatalog } from "./services/catalog";
import { getRateHistory } from "./services/history";
import { getRateEditor } from "./services/editor";
import type {
  ActionResult,
  RateInput,
  TargetState,
  ImportPreview,
  RateEditorData,
} from "./types";
export async function loadRateEditor(id: string | null, duplicate: boolean): Promise<ActionResult<RateEditorData>> {
  await requireSession();
  if (id !== null && !/^[a-z0-9]{15}$/.test(id)) return { error: "Mã dòng giá không hợp lệ." };
  try { return { data: await getRateEditor(id ?? undefined, duplicate) }; }
  catch (error) { return rateError(error); }
}
export async function loadHistory(series: string, page: number): Promise<ActionResult<Awaited<ReturnType<typeof getRateHistory>>>> {
  await requireSession();
  if (!/^[a-z0-9]{15}$/.test(series) || !Number.isInteger(page) || page < 1) return { error: "Thông tin lịch sử không hợp lệ." };
  try { return { data: await getRateHistory(series, page) }; }
  catch (error) { return rateError(error); }
}
export async function loadTarget(
  route: string,
  carrier: string,
): Promise<ActionResult<TargetState>> {
  await requireSession();
  try {
    return { data: await getTarget(route, carrier) };
  } catch (e) {
    return rateError(e);
  }
}
export async function saveRate(
  input: RateInput,
): Promise<ActionResult<{ id: string }>> {
  const { pb } = await requireSession();
  try {
    validateRateInput(input);
    const result = await pb.send<{ items: { id: string }[] }>(
      "/api/megaworld/admin/rates",
      { method: "POST", body: input },
    );
    revalidatePath("/admin/rates");
    revalidatePath("/admin/dashboard");
    return { data: { id: result.items[0].id } };
  } catch (e) {
    return rateError(e);
  }
}
export async function previewImport(
  form: FormData,
): Promise<ActionResult<ImportPreview>> {
  const { pb } = await requireSession();
  try {
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      !/\.xlsx$/i.test(file.name) ||
      !file.size ||
      file.size > 2 * 1024 * 1024
    )
      return { error: "Chọn file .xlsx, tối đa 2 MiB và 500 dòng." };
    const data = await pb.send<ImportPreview>(
      "/api/megaworld/admin/imports/preview",
      {
        method: "POST",
        body: {
          file_name: file.name,
          file_base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
        },
      },
    );
    const [job, catalog] = await Promise.all([
      pb.collection("import_jobs").getOne(data.id, { fields: "payload" }),
      getCatalog(),
    ]);
    const payload = (
      typeof job.payload === "string" ? JSON.parse(job.payload) : job.payload
    ) as { row: number; input: RateInput }[] | null;
    for (const item of data.items) {
      const input = payload?.find((r) => r.row === item.row)?.input;
      const route = catalog.routes.find((r) => r.id === input?.route);
      item.carrier =
        catalog.carriers.find((c) => c.id === input?.carrier)?.code || "—";
      item.route = route
        ? `${catalog.ports.find((p) => p.id === route.pol)?.name} → ${catalog.ports.find((p) => p.id === route.pod)?.name}`
        : "—";
    }
    return { data };
  } catch (e) {
    return rateError(e);
  }
}
export async function commitImport(
  id: string,
): Promise<ActionResult<{ imported_rows: number }>> {
  const { pb } = await requireSession();
  if (!/^[a-z0-9]{15}$/.test(id)) return { error: "Mã import không hợp lệ." };
  try {
    const data = await pb.send<{ imported_rows: number }>(
      `/api/megaworld/admin/imports/${id}/commit`,
      { method: "POST", body: {} },
    );
    revalidatePath("/admin/rates");
    revalidatePath("/admin/dashboard");
    return { data };
  } catch (e) {
    return rateError(e);
  }
}
