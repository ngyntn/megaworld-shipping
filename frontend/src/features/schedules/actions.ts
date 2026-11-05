"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/services/session";
import { getSchedules } from "@/features/operations/services/queries";
import { operationError } from "@/features/operations/services/errors";
import type {
  ScheduleInput,
  SchedulePage,
  Schedule,
} from "@/features/operations/types";
export async function loadSchedules(
  query: Record<string, string>,
): Promise<{ data?: SchedulePage; error?: string }> {
  await requireSession();
  try {
    return { data: await getSchedules(query) };
  } catch (e) {
    return operationError(e);
  }
}
export async function saveSchedule(
  input: ScheduleInput,
  id?: string,
): Promise<{ data?: Schedule; error?: string }> {
  const { pb } = await requireSession();
  try {
    if (
      !input.vessel_name.trim() ||
      !input.etd ||
      !input.eta ||
      input.eta < input.etd
    )
      throw Error("Nhập tên tàu và ngày hợp lệ; ETA phải từ ETD trở đi.");
    if (id && !/^[a-z0-9]{15}$/.test(id))
      throw Error("Mã chuyến không hợp lệ.");
    const data = await pb.send<Schedule>(
      "/api/megaworld/admin/schedules" + (id ? `/${id}` : ""),
      { method: id ? "PATCH" : "POST", body: input },
    );
    revalidatePath("/admin/schedules");
    return { data };
  } catch (e) {
    return operationError(e);
  }
}
