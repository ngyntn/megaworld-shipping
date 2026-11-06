"use client";
import { DatePicker } from "@/components/ui/date-picker";
import { useModalDismiss } from "@/components/ui/modal-context";
import { StyledSelect } from "@/components/ui/styled-select";
import { Field } from "@/features/operations/components/shared";
import { saveEvent } from "../actions";
import { useDeleteItem } from "../hooks/use-delete-item";
import { useWorkspaceAction } from "../hooks/use-workspace-action";
import type { EventDraft } from "../hooks/use-calendar";
import { eventCategories } from "../types";
import { categoryMeta } from "../utils";
import { DialogActions, WorkspaceDialog } from "./workspace-dialog";

const categoryOptions = eventCategories.map((value) => ({ value, label: categoryMeta[value].label }));

export function EventDialog({ draft, onClosed }: { draft: EventDraft; onClosed: () => void }) {
  return (
    <WorkspaceDialog title={draft.event ? "Sửa lịch làm việc" : "Thêm lịch làm việc"} onClosed={onClosed}>
      <EventForm draft={draft} />
    </WorkspaceDialog>
  );
}

function EventForm({ draft: { day, event } }: { draft: EventDraft }) {
  const dismiss = useModalDismiss();
  const { pending, run } = useWorkspaceAction();
  const removal = useDeleteItem("workspace_events", {
    title: "Xóa lịch này?",
    description: "Lịch làm việc sẽ bị xóa khỏi Không gian của tôi và không thể khôi phục.",
  });
  return (
    <form
      className="ws-form"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        run(() => saveEvent(event?.id ?? "", form), dismiss);
      }}
    >
      <Field label="Nội dung">
        <input name="title" defaultValue={event?.title} required maxLength={200} placeholder="Ví dụ: Gọi khách chốt giá" />
      </Field>
      <div className="op-grid">
        <DatePicker label="Ngày" name="day" defaultValue={day} required />
        <Field label="Giờ (tùy chọn)">
          <input name="time" type="time" defaultValue={event?.time} />
        </Field>
      </div>
      <StyledSelect label="Loại lịch" name="category" defaultValue={event?.category ?? "customer"} options={categoryOptions} />
      <DialogActions
        pending={pending || removal.pending}
        onDelete={event ? () => removal.remove(event.id, dismiss) : undefined}
      />
    </form>
  );
}
