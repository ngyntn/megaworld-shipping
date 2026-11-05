"use client";
import { useTransition } from "react";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/feedback/toast-provider";
import { deleteRecords } from "../actions";
import type { DeleteKind, DeleteResult } from "../types";

const NOUN: Record<DeleteKind, string> = {
  rates: "dòng giá",
  schedules: "chuyến tàu",
  carriers: "hãng tàu",
  ports: "cảng",
};
const NOTE: Record<DeleteKind, string> = {
  rates: "Giá gốc, lợi nhuận và liên kết lịch tàu của các dòng này sẽ bị xoá. Nếu xoá giá hiện hành, đợt giá liền trước của cùng container sẽ trở lại làm giá hiện hành.",
  schedules: "Chuyến đang gắn với dòng giá sẽ được giữ lại (hãy dùng Hủy chuyến).",
  carriers: "Hãng còn dòng giá hoặc lịch tàu sẽ được giữ lại (hãy tắt Hiển thị).",
  ports: "Cảng thuộc tuyến đang có giá hoặc lịch tàu sẽ được giữ lại (hãy tắt Hiển thị).",
};

function summary(kind: DeleteKind, result: DeleteResult) {
  const kept = result.skipped.map((item) => `${item.label} — ${item.reason}`).join("; ");
  if (!result.skipped.length) return `Đã xoá ${result.deleted} ${NOUN[kind]}.`;
  return `Đã xoá ${result.deleted} ${NOUN[kind]}. Giữ lại ${result.skipped.length}: ${kept}.`;
}

/**
 * Confirm → (PIN when every row is selected) → delete → toast.
 * `count` is what the user selected (rows), `ids` the records to delete.
 */
export function useBulkDelete(kind: DeleteKind, onDone: () => void) {
  const ask = useConfirm();
  const toast = useToast();
  const [pending, start] = useTransition();

  async function remove({ ids, count, all }: { ids: string[]; count: number; all: boolean }) {
    if (!ids.length || pending) return;
    const answer = await ask({
      title: `Xoá ${count} ${NOUN[kind]}?`,
      description: `${all ? `Bạn đang chọn tất cả ${NOUN[kind]} trong danh sách. ` : ""}${NOTE[kind]} Thao tác này không thể hoàn tác.`,
      confirmLabel: "Xoá",
      destructive: true,
      pin: all,
    });
    if (!answer) return;
    start(async () => {
      const result = await deleteRecords(kind, ids, { all, pin: typeof answer === "string" ? answer : undefined });
      if (!result.data) {
        toast(result.error, "error");
        return;
      }
      const message = summary(kind, result.data);
      if (!result.data.deleted) toast(message, "error");
      else toast(message, result.data.skipped.length ? "info" : "success");
      onDone();
    });
  }
  return { remove, pending };
}
