"use client";
import { useCallback, useEffect, useRef } from "react";
import { ModalDismissContext } from "@/components/ui/modal-context";
import { useDismissOnOutsideClick } from "../hooks/use-dismiss-on-outside-click";
import { useFloatingWindow } from "../hooks/use-floating-window";
import { WhiteboardDialog } from "./whiteboard-dialog";

const CLOSE_MS = 220;

/** Non-modal floating window: no backdrop, the page behind stays visible and usable. */
export function WhiteboardWindow({ onClosed }: { onClosed: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const onClosedRef = useRef(onClosed);
  const { frame, dragProps, resizeProps } = useFloatingWindow();
  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  const dismiss = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    ref.current?.classList.add("is-closing");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => onClosedRef.current(), reduced ? 0 : CLOSE_MS);
  }, []);
  useDismissOnOutsideClick(ref, dismiss);

  return (
    <ModalDismissContext value={dismiss}>
      <div
        ref={ref}
        className="whiteboard-window"
        role="dialog"
        aria-label="Bảng trắng"
        style={frame ? { left: frame.x, top: frame.y, width: frame.w, height: frame.h } : { visibility: "hidden" }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            dismiss();
          }
        }}
      >
        <WhiteboardDialog dragProps={dragProps} />
        <div className="wb-resize" aria-hidden="true" {...resizeProps} />
      </div>
    </ModalDismissContext>
  );
}
