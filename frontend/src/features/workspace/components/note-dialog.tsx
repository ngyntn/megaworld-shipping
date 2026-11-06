"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useModalDismiss } from "@/components/ui/modal-context";
import { Field } from "@/features/operations/components/shared";
import { deleteWorkspaceItem } from "../actions";
import { useNoteAutosave, type AutosaveStatus } from "../hooks/use-note-autosave";
import { useWorkspaceAction } from "../hooks/use-workspace-action";
import { noteKinds, type NoteKind, type WorkspaceNote } from "../types";
import { noteKindMeta } from "../utils";
import { WorkspaceDialog } from "./workspace-dialog";

const DEFAULT_KIND: NoteKind = "reminder";
const statusText: Record<AutosaveStatus, string> = {
  idle: "Tự động lưu",
  saving: "Đang lưu…",
  saved: "Đã lưu",
  error: "Chưa lưu được",
};

/** `note` undefined = new note. Every change is saved automatically; there is no save button. */
export function NoteDialog({ note, onClosed }: { note?: WorkspaceNote; onClosed: () => void }) {
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
      <NoteFields note={note} disabled={deleting} onChange={autosave.change} onSubmit={autosave.flush} />
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
  note?: WorkspaceNote;
  disabled: boolean;
  onChange: Autosave["change"];
  onSubmit: () => void;
};

function NoteFields({ note, disabled, onChange, onSubmit }: FieldsProps) {
  const read = (form: HTMLFormElement) => {
    const data = new FormData(form);
    return { title: String(data.get("title") ?? ""), body: String(data.get("body") ?? ""), kind: String(data.get("kind") ?? DEFAULT_KIND) as NoteKind };
  };
  return (
    <form
      className="ws-form"
      onChange={(e) => onChange(read(e.currentTarget))}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <fieldset className="ws-note-fields" disabled={disabled}>
        <Field label="Tiêu đề">
          <input name="title" defaultValue={note?.title} maxLength={120} placeholder="Ví dụ: Nhắc việc" autoFocus={!note} />
        </Field>
        <Field label="Nội dung">
          <textarea name="body" defaultValue={note?.body} rows={9} maxLength={2000} placeholder="Mỗi ý một dòng…" />
        </Field>
        <div className="ws-kinds" role="radiogroup" aria-label="Loại ghi chú">
          <span className="ws-kinds-label">Loại ghi chú</span>
          {noteKinds.map((kind) => (
            <label key={kind} className={`ws-kind ${kind}`}>
              <input type="radio" name="kind" value={kind} defaultChecked={(note?.kind ?? DEFAULT_KIND) === kind} />
              {noteKindMeta[kind].label}
            </label>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
