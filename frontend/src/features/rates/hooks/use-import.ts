"use client";
import { useRef, useState, useTransition } from "react";
import { commitImport, previewImport } from "../actions";
import { useToast } from "@/components/feedback/toast-provider";
import { useConfirm } from "@/components/ui/confirm-provider";
import type { ImportPreview } from "../types";
export function useImport() {
  const [preview, setPreview] = useState<ImportPreview | null>(null),
    [fileName, setFileName] = useState(""),
    [error, setErrorState] = useState(""),
    [page, setPage] = useState(1),
    [done, setDone] = useState<number | null>(null),
    [conflict, setConflict] = useState(false);
  const toast = useToast();
  const ask = useConfirm();
  const setError = (message: string) => { setErrorState(message); if (message) toast(message, "error"); };
  const [pending, startTransition] = useTransition(),
    fileInput = useRef<HTMLInputElement>(null);
  function upload(file?: File) {
    if (!file || pending) return;
    setPreview(null);
    setPage(1);
    setDone(null);
    setError("");
    setConflict(false);
    setFileName(file.name);
    const form = new FormData();
    form.set("file", file);
    startTransition(async () => {
      const result = await previewImport(form);
      if (result.data) setPreview(result.data);
      else setError(result.error);
    });
  }
  async function confirm() {
    if (!preview || pending || conflict || done != null) return;
    if (!await ask({ title: "Xác nhận nhập bảng giá?", description: `Nhập ${preview.valid_rows} dòng hợp lệ. Các giá bị thay thế sẽ được lưu lại trong lịch sử.`, confirmLabel: "Nhập bảng giá" })) return;
    setError("");
    startTransition(async () => {
      const result = await commitImport(preview.id);
      if (result.data) {
        setDone(result.data.imported_rows);
        toast(`Đã nhập thành công ${result.data.imported_rows} dòng giá.`);
      }
      else {
        setError(result.error);
        setConflict(!!result.conflict);
      }
    });
  }
  return {
    preview,
    fileName,
    error,
    done,
    conflict,
    pending,
    fileInput,
    upload,
    confirm,
    page,
    setPage,
  };
}
