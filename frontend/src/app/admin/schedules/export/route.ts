import { handleExcelExport } from "@/features/excel-export/services/handler";
export const runtime = "nodejs";
export async function POST(request: Request) { return handleExcelExport(request, "schedules"); }
