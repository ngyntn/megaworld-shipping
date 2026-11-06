"use client";
import { Eraser } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/feedback/toast-provider";
import { useModalDismiss } from "@/components/ui/modal-context";
import { useWhiteboard } from "../hooks/use-whiteboard";
import { useWhiteboardShortcut } from "../hooks/use-whiteboard-shortcut";

type Props = { dragProps: React.HTMLAttributes<HTMLElement> };

export function WhiteboardDialog({ dragProps }: Props) {
  const dismiss = useModalDismiss();
  useWhiteboardShortcut(dismiss);
  const toast = useToast();
  const board = useWhiteboard(toast);
  const ask = useConfirm();
  async function startNew() {
    if (!board.empty) {
      const ok = await ask({
        title: "Tạo bảng mới?",
        description: "Nội dung hiện tại sẽ bị xóa và không thể khôi phục.",
        confirmLabel: "Xóa và tạo bảng mới",
        destructive: true,
      });
      if (!ok) return;
    }
    board.clear();
  }
  return (
    <section className="whiteboard" aria-labelledby="whiteboard-title">
      <header className="whiteboard-header" {...dragProps}>
        <h1 id="whiteboard-title">Bảng trắng</h1>
        <div className="whiteboard-actions">
          <button type="button" className="wb-icon-btn" aria-label="Tạo bảng mới" title="Tạo bảng mới" onClick={startNew}>
            <Eraser size={19} />
          </button>
        </div>
      </header>
      <div className="wb-scroll" ref={board.scrollRef} onMouseDown={(e) => {
        // Clicking the empty paper below the text still focuses the board.
        if (e.target === e.currentTarget) { e.preventDefault(); board.editorRef.current?.focus(); }
      }}>
        {board.empty && <span className="wb-placeholder">Dán hoặc gõ nội dung vào đây…</span>}
        <div
          ref={board.editorRef}
          className="wb-editor"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          role="textbox"
          aria-multiline="true"
          aria-label="Bảng trắng"
        />
        <div ref={board.caretRef} className="wb-caret" hidden />
      </div>
      {board.zoom && (
        <div
          className="wb-lightbox"
          role="dialog"
          aria-label="Xem ảnh"
          tabIndex={-1}
          ref={(el) => el?.focus()}
          onClick={board.closeZoom}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            // Esc closes the viewer only, not the whole whiteboard.
            e.preventDefault();
            e.stopPropagation();
            board.closeZoom();
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
          <img src={board.zoom} alt="Ảnh phóng to" />
        </div>
      )}
    </section>
  );
}
