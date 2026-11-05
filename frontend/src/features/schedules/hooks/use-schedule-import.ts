"use client";
import { useRef, useState, useTransition } from "react";
import { commitScheduleImport, previewScheduleImport } from "../import-actions";
import { useToast } from "@/components/feedback/toast-provider";
import { useConfirm } from "@/components/ui/confirm-provider";
import type { ScheduleImportPreview } from "../types";
export function useScheduleImport(onImported: () => void) {
  const [preview, setPreview] = useState<ScheduleImportPreview | null>(null),
    [fileName, setFileName] = useState(""),
    [page, setPage] = useState(1),
    [done, setDone] = useState<number | null>(null),
    [conflict, setConflict] = useState(false);
  const toast = useToast();
  const ask = useConfirm();
  const [pending, startTransition] = useTransition(),
    fileInput = useRef<HTMLInputElement>(null);
  function upload(file?: File) {
    if (!file || pending) return;
    setPreview(null);
    setPage(1);
    setDone(null);
    setConflict(false);
    setFileName(file.name);
    const form = new FormData();
    form.set("file", file);
    startTransition(async () => {
      const result = await previewScheduleImport(form);
      if (result.data) setPreview(result.data);
      else toast(result.error, "error");
    });
  }
  async function confirm() {
    if (!preview || pending || conflict || done != null) return;
    if (!await ask({ title: "Xác nhận nhập lịch tàu?", description: `Nhập ${preview.valid_rows} chuyến hợp lệ. Chuyến đã có sẽ được cập nhật theo file.`, confirmLabel: "Nhập lịch tàu" })) return;
    startTransition(async () => {
      const result = await commitScheduleImport(preview.id);
      if (result.data) {
        setDone(result.data.imported_rows);
        toast(`Đã nhập thành công ${result.data.imported_rows} chuyến tàu.`);
        onImported();
      } else {
        toast(result.error, "error");
        setConflict(!!result.conflict);
      }
    });
  }
  return { preview, fileName, done, conflict, pending, fileInput, page, setPage, upload, confirm };
}
