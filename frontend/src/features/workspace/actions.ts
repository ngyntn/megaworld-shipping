"use server";
import { requireSession } from "@/features/auth/services/session";
import { operationError } from "@/features/operations/services/errors";
import type { Result } from "@/features/operations/types";
import { parseEventInput, parseNoteInput } from "./schemas/workspace-input";

const ID = /^[a-z0-9]{15}$/;
/** Server actions receive untrusted input: only PocketBase ids ("" allowed when creating). */
function checkId(id: unknown, optional = false) {
  if (optional && id === "") return;
  if (typeof id !== "string" || !ID.test(id)) throw new Error("Dữ liệu không hợp lệ.");
}

export async function saveEvent(id: string, form: FormData): Promise<Result> {
  const { pb, staff } = await requireSession();
  try {
    checkId(id, true);
    const input = parseEventInput(form);
    if (id) await pb.collection("workspace_events").update(id, input);
    else await pb.collection("workspace_events").create({ ...input, owner: staff.id });
    return { success: "Đã lưu lịch làm việc." };
  } catch (e) {
    return operationError(e);
  }
}

/** Autosave target: creates the note on first save and returns its id for later updates. */
export async function saveNote(id: string, input: unknown): Promise<Result & { id?: string }> {
  const { pb, staff } = await requireSession();
  try {
    checkId(id, true);
    const data = parseNoteInput(input);
    const record = id
      ? await pb.collection("workspace_notes").update(id, data)
      : await pb.collection("workspace_notes").create({ ...data, owner: staff.id });
    return { id: record.id };
  } catch (e) {
    return operationError(e);
  }
}

const removable = {
  workspace_events: "Đã xóa lịch.",
  workspace_notes: "Đã xóa ghi chú.",
  saved_quotes: "Đã xóa báo giá đã lưu.",
} as const;

export async function deleteWorkspaceItem(kind: keyof typeof removable, id: string): Promise<Result> {
  const { pb } = await requireSession();
  try {
    if (!Object.hasOwn(removable, kind)) throw new Error("Dữ liệu không hợp lệ.");
    checkId(id);
    await pb.collection(kind).delete(id);
    return { success: removable[kind] };
  } catch (e) {
    return operationError(e);
  }
}

/** Snapshots one container price of a rate row into "Báo giá đã lưu". */
export async function saveQuote(rateVersionId: string): Promise<Result> {
  const { pb, staff } = await requireSession();
  try {
    checkId(rateVersionId);
    const existing = await pb.collection("saved_quotes").getList(1, 1, {
      filter: pb.filter("rate_version = {:id}", { id: rateVersionId }),
      fields: "id",
    });
    if (existing.items[0]) return { success: "Báo giá này đã có trong Không gian của tôi." };
    const version = await pb.collection("rate_versions").getOne(rateVersionId, {
      expand: "series.carrier,series.route.pol,series.route.pod",
    });
    const series = version.expand?.series;
    const route = series?.expand?.route;
    const carrier = series?.expand?.carrier;
    if (!route?.expand?.pol || !route.expand.pod || !carrier) throw new Error("Không tìm thấy dòng giá.");
    await pb.collection("saved_quotes").create({
      owner: staff.id,
      rate_version: version.id,
      route_label: `${route.expand.pol.name} → ${route.expand.pod.name}`.slice(0, 200),
      carrier_code: String(carrier.code).slice(0, 40),
      container_type: series.container_type,
      price_cents: version.sell_price_cents,
      valid_to: String(version.valid_to).slice(0, 10),
    });
    return { success: "Đã lưu vào Không gian của tôi." };
  } catch (e) {
    return operationError(e);
  }
}
