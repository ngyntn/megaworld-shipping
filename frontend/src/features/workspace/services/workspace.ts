import "server-only";
import { requireSession } from "@/features/auth/services/session";
import { vietnamToday } from "@/features/rates/services/queries";
import { isMonthKey, monthRange } from "../utils";
import type { SavedQuote, WorkspaceData, WorkspaceEvent, WorkspaceNote } from "../types";

const QUOTE_LIMIT = 50;

/** Calendar items of one month, every personal note and the latest saved quotes of the signed-in staff. */
export async function getWorkspace(monthParam?: string): Promise<WorkspaceData> {
  const { pb } = await requireSession();
  const today = vietnamToday();
  const month = isMonthKey(monthParam) ? monthParam : today.slice(0, 7);
  const { start, end } = monthRange(month);
  const [events, notes, quotes] = await Promise.all([
    pb.collection("workspace_events").getFullList({
      filter: pb.filter("day >= {:start} && day <= {:end}", { start, end }),
      sort: "day,time,created",
      fields: "id,title,day,time,category",
    }),
    pb.collection("workspace_notes").getFullList({ sort: "-updated", fields: "id,title,body,kind" }),
    pb.collection("saved_quotes").getList(1, QUOTE_LIMIT, {
      sort: "-created",
      fields: "id,route_label,carrier_code,container_type,price_cents,valid_to,created",
    }),
  ]);
  return {
    today,
    month,
    events: events as unknown as WorkspaceEvent[],
    notes: notes as unknown as WorkspaceNote[],
    quotes: quotes.items as unknown as SavedQuote[],
  };
}
