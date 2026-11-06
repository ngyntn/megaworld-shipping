import { templateDetails, type ExportKind, type ExportRequest } from "../types.ts";

export class ExportError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

export function parseExportRequest(value: unknown, kind: ExportKind): ExportRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ExportError("Yêu cầu xuất file không hợp lệ.");
  const body = value as Record<string, unknown>;
  if (body.scope !== "selected" && body.scope !== "filtered") throw new ExportError("Chọn phạm vi xuất file.");
  if (!Array.isArray(body.ids) || body.ids.length > 1000 || body.ids.some(id => typeof id !== "string" || !/^[a-z0-9]{15}$/.test(id)))
    throw new ExportError("Danh sách dòng đã chọn không hợp lệ.");
  const ids = [...new Set(body.ids as string[])];
  if (body.scope === "selected" && !ids.length) throw new ExportError("Hãy tick ít nhất một dòng cần xuất.");
  const rawFilters = body.filters;
  if (!rawFilters || typeof rawFilters !== "object" || Array.isArray(rawFilters)) throw new ExportError("Bộ lọc không hợp lệ.");
  const allowed = kind === "rates" ? ["pol", "pod", "carrier", "q", "month", "tab"] : ["pol", "pod", "carrier", "route", "from", "to", "status", "q"];
  const filters: Record<string, string> = {};
  for (const [key, val] of Object.entries(rawFilters)) {
    if (!allowed.includes(key)) continue; // Pagination never limits an export.
    if (typeof val !== "string" || val.length > 200) throw new ExportError("Bộ lọc không hợp lệ.");
    if (val) filters[key] = val;
  }
  if (filters.month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(filters.month)) throw new ExportError("Tháng không hợp lệ.");
  const rawDetails = body.details;
  if (!rawDetails || typeof rawDetails !== "object" || Array.isArray(rawDetails)) throw new ExportError("Thông tin người nhận không hợp lệ.");
  const details = { ...templateDetails[kind] };
  for (const key of ["client", "contact", "address", "sales"] as const) {
    const val = (rawDetails as Record<string, unknown>)[key];
    if (typeof val !== "string" || val.length > 500 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(val)) throw new ExportError("Thông tin người nhận không hợp lệ.");
    details[key] = val.trim();
  }
  const quantity = (rawDetails as Record<string, unknown>).quantity;
  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 100000) throw new ExportError("Số lượng container phải là số nguyên dương.");
  details.quantity = quantity;
  return { scope: body.scope, ids, filters, details };
}
