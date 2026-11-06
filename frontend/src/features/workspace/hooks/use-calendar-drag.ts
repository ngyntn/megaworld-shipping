"use client";
import { useCallback, useEffect, useRef, type DragEvent } from "react";
import { deleteWorkspaceItem, moveEvent } from "../actions";
import type { WorkspaceEvent } from "../types";
import { useWorkspaceAction } from "./use-workspace-action";

const EVENT_MIME = "application/x-megaworld-calendar-event";

/** Only a drag started in this calendar can move or delete one of its items. */
export function useCalendarDrag(onMoved: (day: string) => void) {
  const calendarRef = useRef<HTMLElement>(null);
  const active = useRef<WorkspaceEvent | null>(null);
  const { pending, run } = useWorkspaceAction();
  const runRef = useRef(run);
  useEffect(() => { runRef.current = run; }, [run]);

  const end = useCallback(() => {
    active.current = null;
  }, []);

  useEffect(() => {
    function outside(target: EventTarget | null) {
      return target instanceof Node && !!calendarRef.current && !calendarRef.current.contains(target);
    }
    function dragOver(event: globalThis.DragEvent) {
      if (!active.current || !outside(event.target)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    }
    function dropOutside(event: globalThis.DragEvent) {
      const item = active.current;
      if (!item || !outside(event.target)) return;
      event.preventDefault();
      end();
      runRef.current(() => deleteWorkspaceItem("workspace_events", item.id));
    }
    document.addEventListener("dragover", dragOver);
    document.addEventListener("drop", dropOutside);
    return () => {
      document.removeEventListener("dragover", dragOver);
      document.removeEventListener("drop", dropOutside);
    };
  }, [end]);

  function begin(item: WorkspaceEvent, event: DragEvent<HTMLElement>) {
    if (pending) { event.preventDefault(); return; }
    active.current = item;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(EVENT_MIME, item.id);
    event.stopPropagation();
  }

  function accepts(transfer: DataTransfer) {
    return !!active.current && transfer.types.includes(EVENT_MIME);
  }

  function drop(day: string, transfer: DataTransfer) {
    if (!accepts(transfer)) return false;
    const item = active.current!;
    end();
    if (item.day !== day) run(() => moveEvent(item.id, day), () => onMoved(day));
    else onMoved(day);
    return true;
  }

  return { calendarRef, begin, end, accepts, drop };
}
