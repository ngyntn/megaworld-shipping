"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/services/session";
import { isValidPin } from "@/features/auth/services/hibernate";
import { operationError } from "@/features/operations/services/errors";
import type { ActionResult } from "@/features/rates/types";
import type { DeleteKind, DeleteResult } from "./types";

const KINDS: DeleteKind[] = ["rates", "schedules", "carriers", "ports"];

/**
 * Bulk delete through the backend route (which keeps referenced data safe).
 * Deleting every row of a list ("select all") additionally requires the admin PIN.
 */
export async function deleteRecords(
  kind: DeleteKind,
  ids: string[],
  guard: { all: boolean; pin?: string },
): Promise<ActionResult<DeleteResult>> {
  const { pb } = await requireSession();
  if (!KINDS.includes(kind) || !Array.isArray(ids) || !ids.length || ids.length > 500)
    return { error: "Danh sách cần xoá không hợp lệ." };
  if (guard.all && !isValidPin(guard.pin ?? "")) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return { error: "Mã PIN không đúng. Chưa xoá dữ liệu nào." };
  }
  try {
    const data = await pb.send<DeleteResult>("/api/megaworld/admin/delete", {
      method: "POST",
      body: { kind, ids },
    });
    revalidatePath("/admin", "layout");
    return { data };
  } catch (error) {
    const result = operationError(error);
    return { error: result.error ?? "Không thể xoá dữ liệu." };
  }
}
