"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/feedback/toast-provider";
import { saveNote } from "../actions";
import type { NoteInput } from "../schemas/workspace-input";

const SAVE_DELAY = 600;
export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Saves the note a moment after each change, one request at a time (the first save creates it).
 * Pending changes are flushed when the dialog unmounts, then the page data is refreshed.
 */
export function useNoteAutosave(initialId: string) {
  const id = useRef(initialId);
  const pending = useRef<NoteInput | null>(null);
  const timer = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const changed = useRef(false);
  const stopped = useRef(false);
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const toast = useToast();
  const toastRef = useRef(toast);
  const router = useRouter();
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const input = pending.current;
    pending.current = null;
    if (!input) return queue.current;
    queue.current = queue.current.then(async () => {
      if (stopped.current) return;
      try {
        const result = await saveNote(id.current, input);
        if (result.error) throw new Error(result.error);
        if (result.id) id.current = result.id;
        changed.current = true;
        setStatus("saved");
      } catch (e) {
        setStatus("error");
        toastRef.current(e instanceof Error ? e.message : "Chưa lưu được ghi chú.", "error");
      }
    });
    return queue.current;
  }, []);

  /** An empty note is never stored; it simply waits for some text. */
  const change = useCallback((input: NoteInput) => {
    window.clearTimeout(timer.current);
    if (!input.title.trim() && !input.body.trim()) {
      pending.current = null;
      return;
    }
    pending.current = input;
    setStatus("saving");
    timer.current = window.setTimeout(flush, SAVE_DELAY);
  }, [flush]);

  /** Drops unsaved edits (before deleting); resolves with the id once in-flight saves finish. */
  const discard = useCallback(async () => {
    stopped.current = true;
    pending.current = null;
    window.clearTimeout(timer.current);
    await queue.current;
    return id.current;
  }, []);

  useEffect(() => {
    stopped.current = false;
    return () => {
      void flush().then(() => {
        if (changed.current) router.refresh();
      });
    };
  }, [flush, router]);

  return { status, change, flush, discard };
}
