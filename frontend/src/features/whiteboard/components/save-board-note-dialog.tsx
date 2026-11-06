"use client";
import { useModalDismiss } from "@/components/ui/modal-context";
import { Field } from "@/features/operations/components/shared";
import { TagPicker } from "@/features/workspace/components/tag-picker";
import { DialogActions, WorkspaceDialog } from "@/features/workspace/components/workspace-dialog";
import { useWhiteboardNote } from "../hooks/use-whiteboard-note";

export type BoardNoteDraft = { body: string; hasImages: boolean };

export function SaveBoardNoteDialog({ draft, onClosed }: { draft: BoardNoteDraft; onClosed: () => void }) {
  return <WorkspaceDialog title="Lưu thành ghi chú" onClosed={onClosed}><SaveForm draft={draft} /></WorkspaceDialog>;
}

function SaveForm({ draft }: { draft: BoardNoteDraft }) {
  const dismiss = useModalDismiss();
  const note = useWhiteboardNote(draft.body);
  return <form className="ws-form" spellCheck={false} onSubmit={event => {
    event.preventDefault();
    if (note.loading || note.error || note.pending) return;
    note.save(new FormData(event.currentTarget), dismiss);
  }}>
    <Field label="Tiêu đề"><input data-initial-focus name="title" required maxLength={120} placeholder="Nhập tiêu đề" /></Field>
    {note.loading ? <p className="ws-dialog-hint" role="status">Đang tải nhãn…</p> : note.error ? <p className="error-message" role="alert">{note.error}</p> : <TagPicker tags={note.tags} />}
    {draft.hasImages && <p className="ws-dialog-hint">Ghi chú lưu phần văn bản. Ảnh vẫn được giữ trên bảng trắng.</p>}
    <DialogActions pending={note.loading || note.pending || !!note.error} />
  </form>;
}
