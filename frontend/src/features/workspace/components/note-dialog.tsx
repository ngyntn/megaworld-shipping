"use client";
import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useModalDismiss } from "@/components/ui/modal-context";
import { TagPicker } from "./tag-picker";
import { deleteWorkspaceItem } from "../actions";
import { useNoteAutosave, type AutosaveStatus } from "../hooks/use-note-autosave";
import { useWorkspaceAction } from "../hooks/use-workspace-action";
import type { NoteKind, WorkspaceTag, WorkspaceNote } from "../types";
import { WorkspaceDialog } from "./workspace-dialog";

const DEFAULT_KIND: NoteKind = "reminder";
const statusText: Record<AutosaveStatus, string> = {
  idle: "Tự động lưu",
  saving: "Đang lưu…",
  saved: "Đã lưu",
  error: "Chưa lưu được",
};

/** `note` undefined = new note. Every change is saved automatically; there is no save button. */
export function NoteDialog({ note, tags, onClosed }: { tags: WorkspaceTag[]; note?: WorkspaceNote; onClosed: () => void }) {
  const autosave = useNoteAutosave(note?.id ?? "");
  const [deleting, setDeleting] = useState(false);
  return (
    <WorkspaceDialog
      title={note ? "Sửa ghi chú" : "Ghi chú mới"}
      size="lg"
      onClosed={onClosed}
      aside={
        <>
          <span className={`ws-save-status ${autosave.status}`} role="status">{statusText[autosave.status]}</span>
          <DeleteNote autosave={autosave} onPending={setDeleting} />
        </>
      }
    >
      <NoteFields tags={tags} note={note} disabled={deleting} onChange={autosave.change} onSubmit={autosave.flush} />
    </WorkspaceDialog>
  );
}

type Autosave = ReturnType<typeof useNoteAutosave>;

function DeleteNote({ autosave, onPending }: { autosave: Autosave; onPending: (pending: boolean) => void }) {
  const dismiss = useModalDismiss();
  const confirm = useConfirm();
  const { pending, run } = useWorkspaceAction();
  async function remove() {
    if (!(await confirm({ title: "Xóa ghi chú này?", description: "Ghi chú sẽ bị xóa khỏi Không gian của tôi và không thể khôi phục.", confirmLabel: "Xóa", destructive: true }))) return;
    onPending(true);
    const id = await autosave.discard();
    if (!id) return dismiss();
    run(() => deleteWorkspaceItem("workspace_notes", id), dismiss);
  }
  return (
    <button type="button" className="confirm-close ws-note-delete" aria-label="Xóa ghi chú" title="Xóa ghi chú" disabled={pending} onClick={remove}>
      <Trash2 size={17} />
    </button>
  );
}

type FieldsProps = {
  tags: WorkspaceTag[];
  note?: WorkspaceNote;
  disabled: boolean;
  onChange: Autosave["change"];
  onSubmit: () => void;
};

function NoteFields({ note, tags, disabled, onChange, onSubmit }: FieldsProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const read = (form: HTMLFormElement) => {
    const data = new FormData(form);
    return { title: String(data.get("title") ?? ""), body: String(data.get("body") ?? ""), tag: String(data.get("tag") ?? ""), kind: note?.kind ?? DEFAULT_KIND };
  };
  return (
    <form
      ref={formRef}
      spellCheck={false}
      className="ws-form"
      onChange={(e) => onChange(read(e.currentTarget))}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <fieldset className="ws-note-fields" disabled={disabled}>
        <input data-initial-focus className="ws-note-title-input" aria-label="Tiêu đề" name="title" defaultValue={note?.title} maxLength={120} placeholder="Nhập tiêu đề" autoFocus={!note} onKeyDown={e => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); bodyRef.current?.focus(); }
        }} />
        <textarea ref={bodyRef} className="ws-note-body-input" aria-label="Nội dung" name="body" defaultValue={note?.body} rows={11} maxLength={2000} placeholder="Nhập nội dung, mỗi ý một dòng…" />
        <TagPicker tags={tags} value={note?.tag} onValueChange={tag => {
          if (formRef.current) onChange({ ...read(formRef.current), tag });
        }} />
      </fieldset>
    </form>
  );
}
