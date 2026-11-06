"use client";
import { useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast-provider";
import { downloadExcel } from "../services/download";
import type { ExportKind, ExportRequest } from "../types";

export function useExcelExport(kind: ExportKind) {
  const [pending, setPending] = useState(false);
  const running = useRef(false);
  const toast = useToast();
  async function download(request: ExportRequest) {
    if (running.current) return false;
    running.current = true; setPending(true);
    try {
      await downloadExcel(kind, request);
      toast("Đã tạo file Excel theo mẫu.");
      return true;
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể xuất Excel.", "error");
      return false;
    } finally { running.current = false; setPending(false); }
  }
  return { pending, download };
}
