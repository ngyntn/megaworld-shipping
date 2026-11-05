"use client";
import { useCallback, useState } from "react";
import { StickyNote } from "lucide-react";
import { ModalSurface } from "@/components/ui/modal-surface";
import { useWhiteboardShortcut } from "../hooks/use-whiteboard-shortcut";
import { WhiteboardDialog } from "./whiteboard-dialog";

/**
 * Sidebar entry that opens the whiteboard popup from any admin page.
 * Ctrl+Space opens it from anywhere; while open, the dialog handles Ctrl+Space to close it.
 */
export function WhiteboardButton() {
  const [open, setOpen] = useState(false);
  const openBoard = useCallback(() => setOpen(true), []);
  // When already open, WhiteboardDialog listens for the same shortcut and closes with its animation.
  const onShortcut = useCallback(() => setOpen((value) => (value ? value : true)), []);
  useWhiteboardShortcut(onShortcut);
  return (
    <>
      <button type="button" className="nav" onClick={openBoard}>
        <StickyNote size={18} strokeWidth={1.9} />Bảng trắng      </button>
      {open && (
        <ModalSurface className="whiteboard-backdrop" label="Bảng trắng" onClosed={() => setOpen(false)}>
          <WhiteboardDialog />
        </ModalSurface>
      )}
    </>
  );
}
