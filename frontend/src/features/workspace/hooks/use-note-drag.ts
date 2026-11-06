"use client";
import { useCallback, useEffect, useRef, useState, type HTMLAttributes } from "react";
import { reorderNote } from "../actions";
import type { WorkspaceNote } from "../types";
import { NOTE_MIME } from "../utils";
import { useDeleteItem } from "./use-delete-item";
import { useWorkspaceAction } from "./use-workspace-action";

export function useNoteDrag() {
  const regionRef = useRef<HTMLElement>(null);
  const active = useRef<WorkspaceNote | null>(null);
  const [target, setTarget] = useState("");
  const { pending, run } = useWorkspaceAction();
  const removal = useDeleteItem("workspace_notes", {
    title: "Xóa ghi chú này?", description: "Ghi chú sẽ bị xóa khỏi Ghi chú cá nhân và không thể khôi phục.",
  });
  const removeRef = useRef(removal.remove);
  useEffect(() => { removeRef.current = removal.remove; }, [removal.remove]);
  const end = useCallback(() => { active.current = null; setTarget(""); }, []);

  useEffect(() => {
    const outside = (target: EventTarget | null) => target instanceof Node && !!regionRef.current && !regionRef.current.contains(target);
    function over(event: globalThis.DragEvent) {
      if (!active.current || event.defaultPrevented || !outside(event.target)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    }
    function drop(event: globalThis.DragEvent) {
      const note = active.current;
      // A day on the calendar consumes the drop to create a calendar item.
      if (!note || event.defaultPrevented || !outside(event.target)) return;
      event.preventDefault();
      end();
      void removeRef.current(note.id);
    }
    document.addEventListener("dragover", over);
    document.addEventListener("drop", drop);
    return () => {
      document.removeEventListener("dragover", over);
      document.removeEventListener("drop", drop);
    };
  }, [end]);

  function cardProps(note: WorkspaceNote): HTMLAttributes<HTMLElement> {
    return {
      draggable: !pending && !removal.pending,
      onDragStart(event) {
        if (pending || removal.pending) { event.preventDefault(); return; }
        active.current = note;
        event.dataTransfer.effectAllowed = "copyMove";
        event.dataTransfer.setData(NOTE_MIME, JSON.stringify({ title: note.title, body: note.body, kind: note.kind, tag: note.tag ?? "" }));
      },
      onDragEnd: end,
      onDragOver(event) {
        if (!active.current || !event.dataTransfer.types.includes(NOTE_MIME)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        if (active.current.id !== note.id) setTarget(note.id);
      },
      onDragLeave(event) {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setTarget("");
      },
      onDrop(event) {
        const source = active.current;
        if (!source) return;
        event.preventDefault();
        end();
        if (source.id !== note.id) run(() => reorderNote(source.id, note.id));
      },
    };
  }

  return { regionRef, target, cardProps };
}
