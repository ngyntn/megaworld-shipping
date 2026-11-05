"use client";
import { useEffect } from "react";

export const isWhiteboardShortcut = (event: KeyboardEvent) =>
  event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && event.code === "Space" && !event.repeat;

/** Calls `handler` on Ctrl+Space anywhere on the page (the browser default is suppressed). */
export function useWhiteboardShortcut(handler: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isWhiteboardShortcut(event)) return;
      event.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handler]);
}
