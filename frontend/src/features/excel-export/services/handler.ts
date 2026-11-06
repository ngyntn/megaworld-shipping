import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ClientResponseError } from "pocketbase";
import { getSession } from "@/features/auth/services/session";
import { getRates } from "@/features/rates/services/rate-list";
import { vietnamToday } from "@/features/rates/services/queries";
import { ExportError, parseExportRequest } from "../schemas/export-request";
import { buildQuotationWorkbook } from "../workbook/quotation";
import { buildSchedulesWorkbook } from "../workbook/schedules";
import { getExportSchedules } from "./schedules";
import type { ExportKind } from "../types";

export async function handleExcelExport(request: Request, kind: ExportKind) {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  try {
    if (!await getSession()) return Response.json({ error: "Vui lòng đăng nhập để xuất Excel." }, { status: 401, headers });
    const body = parseExportRequest(await request.json().catch(() => null), kind);
    const template = await readFile(path.join(process.cwd(), "assets", "excel", kind === "rates" ? "quotation.xlsx" : "schedules.xlsx"));
    const today = vietnamToday();
    let file: Uint8Array;
    if (kind === "rates") {
      const rates = await getRates(body.filters, body);
      if (!rates.items.length) throw new ExportError("Không có báo giá phù hợp để xuất.");
      file = buildQuotationWorkbook(template, rates.items, body.details, today);
    } else {
      const rows = await getExportSchedules(body);
      if (!rows.length) throw new ExportError("Không có lịch tàu phù hợp để xuất.");
      file = buildSchedulesWorkbook(template, rows, body.details);
    }
    return new Response(Buffer.from(file), { headers: { ...headers,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="MWS-${kind === "rates" ? "QUOTATION" : "SCHEDULE"}-${today.replaceAll("-", "")}.xlsx"`,
    } });
  } catch (error) {
    if (error instanceof ExportError) return Response.json({ error: error.message }, { status: error.status, headers });
    if (error instanceof ClientResponseError && [400, 401, 403].includes(error.status)) return Response.json({ error: "Không thể xuất dữ liệu. Hãy kiểm tra bộ lọc và quyền truy cập." }, { status: error.status, headers });
    console.error("Excel export failed", error);
    return Response.json({ error: "Không thể tạo file Excel. Vui lòng thử lại." }, { status: 500, headers });
  }
}
