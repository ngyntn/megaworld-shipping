"use client";
import { useEffect } from "react";

/** Other layers (confirm dialog, toasts) sit outside the window but still belong to the interaction. */
const IGNORE = "dialog[open], .toast-viewport";

/** Calls `onDismiss` when the user presses the pointer anywhere outside `ref`. */
export function useDismissOnOutsideClick(ref: React.RefObject<HTMLElement | null>, onDismiss: () => void) {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target || ref.current?.contains(target) || target.closest(IGNORE)) return;
      onDismiss();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [ref, onDismiss]);
}
