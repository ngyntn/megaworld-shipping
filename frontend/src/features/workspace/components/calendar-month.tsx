"use client";
import { useState } from "react";
import type { WorkspaceEvent } from "../types";
import { categoryMeta, dayMonth, monthCells } from "../utils";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MAX_DOTS = 4;

type Props = {
  month: string;
  today: string;
  selected: string;
  byDay: Map<string, WorkspaceEvent[]>;
  onSelect: (day: string) => void;
  /** Note drag-and-drop: which drags a day accepts and what happens on drop. */
  accepts: (transfer: DataTransfer) => boolean;
  onDrop: (day: string, transfer: DataTransfer) => void;
};

export function CalendarMonth({ month, today, selected, byDay, onSelect, accepts, onDrop }: Props) {
  const [target, setTarget] = useState<string | null>(null);
  return (
    <div className="ws-month" aria-label="Lịch tháng">
      {WEEKDAYS.map((d) => <span key={d} className="ws-weekday" aria-hidden="true">{d}</span>)}
      {monthCells(month).map((day, i) => {
        if (!day) return <span key={`blank${i}`} className="ws-day empty" />;
        const items = byDay.get(day) ?? [];
        const classes = ["ws-day", day === today && "today", day === selected && "selected", day === target && "drop-target"]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={day}
            type="button"
            className={classes}
            aria-pressed={day === selected}
            aria-label={`Ngày ${dayMonth(day)}${items.length ? `, ${items.length} lịch` : ""}`}
            onClick={() => onSelect(day)}
            onDragOver={(e) => {
              if (!accepts(e.dataTransfer)) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              if (target !== day) setTarget(day);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setTarget(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setTarget(null);
              onDrop(day, e.dataTransfer);
            }}
          >
            <b>{Number(day.slice(8))}</b>
            <span className="ws-dots" aria-hidden="true">
              {items.slice(0, MAX_DOTS).map((e) => <i key={e.id} className={categoryMeta[e.category].tone} />)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
