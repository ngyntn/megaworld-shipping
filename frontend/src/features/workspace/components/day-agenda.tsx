import type { DragEvent } from "react";
import { Clock } from "lucide-react";
import { tagStyle } from "../tags";
import type { WorkspaceEvent, WorkspaceTag } from "../types";
import { dayMonth } from "../utils";

type Props = { tags: WorkspaceTag[]; day: string; today: string; items: WorkspaceEvent[]; onEdit: (event: WorkspaceEvent) => void; onDragStart: (item: WorkspaceEvent, event: DragEvent<HTMLElement>) => void; onDragEnd: () => void };

export function DayAgenda({ day, today, items, onEdit, tags, onDragStart, onDragEnd }: Props) {
  return (
    <div className="ws-upcoming">
      <h3>{day === today ? "Sắp tới hôm nay" : `Lịch ngày ${dayMonth(day)}`}</h3>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" draggable onDragStart={event => onDragStart(item, event)} onDragEnd={onDragEnd} className="ws-event" onClick={() => onEdit(item)} aria-label={`Sửa lịch: ${item.title}`}>
                <span className="ws-time"><Clock size={14} />{item.time || "Cả ngày"}</span>
                <span className="ws-event-title">{item.title}</span>
                <span className="ws-tag ws-custom-tag" style={tagStyle(tags.find(t => t.id === item.tag))}>{tags.find(t => t.id === item.tag)?.name ?? "Không gắn nhãn"}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ws-empty">Chưa có lịch trong ngày này.</p>
      )}
    </div>
  );
}
