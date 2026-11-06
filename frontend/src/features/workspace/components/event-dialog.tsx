"use client";
import { DatePicker } from "@/components/ui/date-picker";
import { useModalDismiss } from "@/components/ui/modal-context";
import { Field } from "@/features/operations/components/shared";
import { saveEvent } from "../actions";
import { useDeleteItem } from "../hooks/use-delete-item";
import { useWorkspaceAction } from "../hooks/use-workspace-action";
import type { EventDraft } from "../hooks/use-calendar";
import type { WorkspaceTag } from "../types";
import { TagPicker } from "./tag-picker";
import { TimePicker } from "./time-picker";
import { DialogActions, WorkspaceDialog } from "./workspace-dialog";

export function EventDialog({ draft, tags, onClosed }: { draft: EventDraft; tags: WorkspaceTag[]; onClosed: () => void }) {
  return (
    <WorkspaceDialog size="lg" title={draft.event ? "Sửa ghi chú" : "Thêm ghi chú"} onClosed={onClosed}>
      <EventForm draft={draft} tags={tags} />
    </WorkspaceDialog>
  );
}

function EventForm({ draft: { day, event }, tags }: { draft: EventDraft; tags: WorkspaceTag[] }) {
  const dismiss = useModalDismiss();
  const { pending, run } = useWorkspaceAction();
  const removal = useDeleteItem("workspace_events", {
    title: "Xóa lịch này?",
    description: "Lịch làm việc sẽ bị xóa khỏi Không gian của tôi và không thể khôi phục.",
  });
  return (
    <form
      spellCheck={false}
      className="ws-form"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        run(() => saveEvent(event?.id ?? "", form), dismiss);
      }}
    >
      <Field label="Nội dung">
        <input data-initial-focus name="title" defaultValue={event?.title} required maxLength={200} placeholder="Ví dụ: Gọi khách chốt giá" />
      </Field>
      <div className="op-grid">
        <DatePicker label="Ngày" name="day" defaultValue={day} required />
        <TimePicker defaultValue={event?.time} />
      </div>
      <input type="hidden" name="category" value={event?.category ?? "other"} />
      <TagPicker tags={tags} value={event?.tag} />
      <DialogActions
        pending={pending || removal.pending}
        onDelete={event ? () => removal.remove(event.id, dismiss) : undefined}
      />
    </form>
  );
}
