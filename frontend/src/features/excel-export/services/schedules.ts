import "server-only";
import { requireSession } from "@/features/auth/services/session";
import type { Schedule, SchedulePage } from "@/features/operations/types";
import { matchesScheduleSearch } from "@/features/schedules/utils";
import type { ExportRequest } from "../types";
import { exportRows } from "../selection";

export async function getExportSchedules(request: ExportRequest) {
  const { pb } = await requireSession();
  const { q = "", ...query } = request.filters;
  const rows: Schedule[] = [];
  let page = 1;
  for (;;) {
    const result = await pb.send<SchedulePage>("/api/megaworld/admin/schedules", { query: { ...query, page, per_page: 100 }, requestKey: null });
    rows.push(...result.items.filter(row => matchesScheduleSearch(row, q)));
    if (!result.has_more) break;
    page++;
  }
  return exportRows(rows.map(row => [row]), request).flat();
}
