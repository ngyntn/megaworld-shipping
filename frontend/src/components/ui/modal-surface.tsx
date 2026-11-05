"use client";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { ModalDismissContext } from "./modal-context";

const CLOSE_MS = 220;

type Props = {
  children: React.ReactNode;
  className: string;
  label: string;
  /** Called once the exit animation has finished; the owner unmounts the modal here. */
  onClosed: () => void;
};

export function ModalSurface({ children, className, label, onClosed }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  const pressedBackdrop = useRef(false);
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  const dismiss = useCallback(() => {
    const dialog = ref.current;
    if (!dialog || closing.current) return;
    closing.current = true;
    dialog.classList.add("is-closing");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => onClosedRef.current(), reduced ? 0 : CLOSE_MS);
  }, []);

  useLayoutEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    // showModal() focuses the first control; the browser may scroll the dialog to reveal it
    // while the panel is still off-screen. Reset that so the slide starts from the edge.
    dialog.scrollTo(0, 0);
    // Paint the off-screen state first, then flip to open so the transition runs from the edge.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => dialog.classList.add("is-open"));
    });
    return () => {
      cancelAnimationFrame(frame);
      dialog.close();
      previous?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <ModalDismissContext value={dismiss}>
      <dialog
        ref={ref}
        className={className}
        aria-label={label}
        onCancel={(e) => {
          // A file picker closed with "Cancel" fires a bubbling `cancel` event from its <input>;
          // only Esc on the dialog itself should close the modal.
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          dismiss();
        }}
        onMouseDown={(e) => {
          pressedBackdrop.current = e.target === e.currentTarget;
        }}
        onClick={(e) => {
          // Dragging a text selection out of the panel and releasing on the backdrop must not close it.
          if (e.target === e.currentTarget && pressedBackdrop.current) dismiss();
        }}
      >
        {children}
      </dialog>
    </ModalDismissContext>
  );
}
