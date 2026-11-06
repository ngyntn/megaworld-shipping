import type { ExportRequest } from "./types";
import { ExportError } from "./schemas/export-request.ts";

/** Filter full result sets before any page slicing; preserve the list's ordering. */
export function exportRows<T extends { id: string }>(groups: T[][], request: Pick<ExportRequest, "scope" | "ids">): T[][] {
  if (request.scope === "filtered") return groups;
  const ids = new Set(request.ids);
  const matching = groups.filter(group => group.some(line => ids.has(line.id)));
  const found = new Set(matching.flat().map(line => line.id));
  if (request.ids.some(id => !found.has(id))) throw new ExportError("Một số dòng đã chọn không còn khớp bộ lọc. Hãy tải lại danh sách và chọn lại.", 409);
  return matching;
}
