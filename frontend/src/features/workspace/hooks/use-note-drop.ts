"use client";
import { saveEvent } from "../actions";
import { noteKinds, type NoteKind } from "../types";
import { noteEventTitle, noteKindMeta, NOTE_MIME } from "../utils";
import { useWorkspaceAction } from "./use-workspace-action";

/** Reads a dragged note payload; null when the drag is not a workspace note. */
function readNote(transfer: DataTransfer) {
  try {
    const value = JSON.parse(transfer.getData(NOTE_MIME));
    const kind: NoteKind = noteKinds.includes(value?.kind) ? value.kind : "other";
    return { title: String(value?.title ?? ""), body: String(value?.body ?? ""), tag: typeof value?.tag === "string" ? value.tag : "", kind };
  } catch {
    return null;
  }
}

/** Dropping a note on a calendar day creates an all-day event titled from the note. */
export function useNoteDrop(onCreated: (day: string) => void) {
  const { pending, run } = useWorkspaceAction();
  const accepts = (transfer: DataTransfer) => transfer.types.includes(NOTE_MIME);
  function drop(day: string, transfer: DataTransfer) {
    const note = readNote(transfer);
    const title = note && noteEventTitle(note);
    if (!note || !title) return;
    const form = new FormData();
    form.set("title", title);
    form.set("day", day);
    form.set("time", "");
    form.set("tag", note.tag);
    form.set("category", noteKindMeta[note.kind].category);
    run(() => saveEvent("", form), () => onCreated(day));
  }
  return { pending, accepts, drop };
}
