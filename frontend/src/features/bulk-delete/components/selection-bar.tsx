"use client";
import { Trash2 } from "lucide-react";

type Props = {
  count: number;
  /** "trên trang này" for paginated lists; omitted for full lists. */
  scope?: string;
  pending?: boolean;
  onDelete: () => void;
};

/** "🗑 Đã chọn N dòng …" — shown while rows are selected; the trash button starts the bulk delete. */
export function SelectionBar({ count, scope, pending, onDelete }: Props) {
  if (!count) return null;
  return (
    <p className="selection-status">
      <button type="button" className="selection-delete" aria-label={`Xoá ${count} dòng đã chọn`} title="Xoá các dòng đã chọn" disabled={pending} onClick={onDelete}>
        <Trash2 size={16} />
      </button>
      Đã chọn {count} dòng{scope ? ` ${scope}` : ""}.
    </p>
  );
}
