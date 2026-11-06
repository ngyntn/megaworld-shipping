import { Clock } from "lucide-react";
import type { WorkspaceEvent } from "../types";
import { categoryMeta, dayMonth } from "../utils";

type Props = { day: string; today: string; items: WorkspaceEvent[]; onEdit: (event: WorkspaceEvent) => void };

export function DayAgenda({ day, today, items, onEdit }: Props) {
  return (
    <div className="ws-upcoming">
      <h3>{day === today ? "Sắp tới hôm nay" : `Lịch ngày ${dayMonth(day)}`}</h3>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="ws-event" onClick={() => onEdit(item)} aria-label={`Sửa lịch: ${item.title}`}>
                <span className="ws-time"><Clock size={14} />{item.time || "Cả ngày"}</span>
                <span className="ws-event-title">{item.title}</span>
                <span className={`ws-tag ${categoryMeta[item.category].tone}`}>{categoryMeta[item.category].label}</span>
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
