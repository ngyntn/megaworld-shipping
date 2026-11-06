"use client";
import { X } from "lucide-react";
import { ModalClose } from "@/components/ui/modal-close";
import { ModalSurface } from "@/components/ui/modal-surface";

type Props = {
  title: string;
  onClosed: () => void;
  /** "lg" for the note editor. */
  size?: "md" | "lg";
  /** Extra header content shown before the close button (save status, delete). */
  aside?: React.ReactNode;
  children: React.ReactNode;
};

/** Centered dialog shared by the calendar, note and saved-quote forms. */
export function WorkspaceDialog({ title, onClosed, size = "md", aside, children }: Props) {
  return (
    <ModalSurface className={`ws-dialog ${size === "lg" ? "ws-dialog-lg" : ""}`} label={title} onClosed={onClosed} initialFocus="[data-initial-focus]">
      <header className="ws-dialog-head">
        <h2>{title}</h2>
        <div className="ws-dialog-aside">
          {aside}
          <ModalClose className="confirm-close" aria-label="Đóng"><X size={18} /></ModalClose>
        </div>
      </header>
      {children}
    </ModalSurface>
  );
}

/** Footer row: optional destructive action on the left, cancel/submit on the right. */
export function DialogActions({ pending, onDelete }: { pending: boolean; onDelete?: () => void }) {
  return (
    <footer className="ws-dialog-foot">
      {onDelete && <button type="button" className="btn2 ws-danger" disabled={pending} onClick={onDelete}>Xóa</button>}
      <ModalClose className="btn2">Hủy</ModalClose>
      <button type="submit" className="btn" disabled={pending}>{pending ? "Đang lưu…" : "Lưu"}</button>
    </footer>
  );
}
