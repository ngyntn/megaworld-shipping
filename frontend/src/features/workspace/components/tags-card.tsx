"use client";
import { useState } from "react";
import { Plus, Tags, Trash2 } from "lucide-react";
import { Field } from "@/features/operations/components/shared";
import { saveTag } from "../actions";
import { useDeleteItem } from "../hooks/use-delete-item";
import { useWorkspaceAction } from "../hooks/use-workspace-action";
import { tagColors, tagStyle, type TagColor } from "../tags";
import type { WorkspaceTag } from "../types";

export function TagsCard({ tags }: { tags: WorkspaceTag[] }) {
  const [editing, setEditing] = useState<WorkspaceTag | null | undefined>();
  return <section className="card ws-card" aria-labelledby="ws-tags-title">
    <header className="ws-card-head">
      <h2 id="ws-tags-title"><Tags size={18} />Quản lý nhãn</h2>
      <button type="button" className="btn2 ws-add" onClick={() => setEditing(null)}><Plus size={16} />Thêm nhãn</button>
    </header>
    <p className="ws-hint">Dùng chung cho lịch làm việc và ghi chú cá nhân.</p>
    <div className="ws-tag-list">
      {tags.map(tag => <button key={tag.id} type="button" className="ws-managed-tag" style={tagStyle(tag)} aria-label={`Sửa nhãn ${tag.name}`} aria-expanded={editing?.id === tag.id} onClick={() => setEditing(tag)}>
        <span>{tag.name}</span>
      </button>)}
    </div>
    {!tags.length && <p className="ws-empty">Chưa có nhãn. Chọn màu nhạt và đặt tên để tạo nhãn đầu tiên.</p>}
    {editing !== undefined && <TagForm key={editing?.id ?? "new"} tag={editing ?? undefined} onClose={() => setEditing(undefined)} />}
  </section>;
}

function TagForm({ tag, onClose }: { tag?: WorkspaceTag; onClose: () => void }) {
  const [color, setColor] = useState<TagColor>(tag?.color ?? "blue");
  const { pending, run } = useWorkspaceAction();
  const removal = useDeleteItem("workspace_tags", {
    title: "Xóa nhãn này?", description: "Nhãn sẽ được gỡ khỏi lịch và ghi chú. Nội dung đã tạo vẫn được giữ lại.",
  });
  const busy = pending || removal.pending;
  return <form className="ws-form ws-tag-form" onSubmit={e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    run(() => saveTag(tag?.id ?? "", form), onClose);
  }}>
    <header className="ws-tag-form-head">
      <h3>{tag ? "Sửa nhãn" : "Thêm nhãn"}</h3>
      {tag && <button type="button" className="ws-icon ws-tag-delete" disabled={busy} aria-label={`Xóa nhãn ${tag.name}`} title="Xóa nhãn" onClick={() => removal.remove(tag.id, onClose)}><Trash2 size={16} /></button>}
    </header>
    <fieldset className="ws-tag-picker"><legend>Chọn màu nhạt</legend>
      <div className="ws-color-palette">
        {(Object.entries(tagColors) as [TagColor, (typeof tagColors)[TagColor]][]).map(([key, meta]) => <label key={key} style={{ background: meta.fill }} title={meta.label}>
          <input type="radio" name="color" value={key} checked={color === key} onChange={() => setColor(key)} aria-label={meta.label} />
          {color === key && <span aria-hidden="true">✓</span>}
        </label>)}
      </div>
    </fieldset>
    <Field label="Tên nhãn"><input name="name" defaultValue={tag?.name} required maxLength={40} placeholder="Ví dụ: Nhắc việc" autoFocus /></Field>
    <div className="ws-tag-form-actions"><button type="button" className="btn2" disabled={busy} onClick={onClose}>Hủy</button><button className="btn" disabled={busy}>{pending ? "Đang lưu…" : "Lưu nhãn"}</button></div>
  </form>;
}
