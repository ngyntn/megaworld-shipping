import "server-only";
import { requireSession } from "@/features/auth/services/session";
import { vietnamToday } from "@/features/rates/services/queries";
import { isMonthKey, monthRange } from "../utils";
import type { SavedQuote, WorkspaceData, WorkspaceEvent, WorkspaceNote } from "../types";

const QUOTE_LIMIT = 50;

export async function getWorkspaceTags(): Promise<WorkspaceData["tags"]> {
  const { pb } = await requireSession();
  return pb.collection("workspace_tags").getFullList({ sort: "created", fields: "id,name,color" });
}

/** Calendar items of one month, every personal note and the latest saved quotes of the signed-in staff. */
export async function getWorkspace(monthParam?: string): Promise<WorkspaceData> {
  const { pb } = await requireSession();
  const today = vietnamToday();
  const month = isMonthKey(monthParam) ? monthParam : today.slice(0, 7);
  const { start, end } = monthRange(month);
  const [events, notes, quotes, tags] = await Promise.all([
    pb.collection("workspace_events").getFullList({
      filter: pb.filter("day >= {:start} && day <= {:end}", { start, end }),
      sort: "day,time,created",
      fields: "id,title,day,time,category,tag",
    }),
    pb.collection("workspace_notes").getFullList({ sort: "position,-created,id", fields: "id,title,body,kind,tag" }),
    pb.collection("saved_quotes").getList(1, QUOTE_LIMIT, {
      sort: "-created",
      fields: "id,route_label,carrier_code,container_type,price_cents,valid_to,created",
    }),
    getWorkspaceTags(),
  ]);
  return {
    tags: tags as unknown as WorkspaceData["tags"],
    today,
    month,
    events: events as unknown as WorkspaceEvent[],
    notes: notes as unknown as WorkspaceNote[],
    quotes: quotes.items as unknown as SavedQuote[],
  };
}
