"use client";
import { useState, type DragEvent } from "react";
import { tagStyle } from "../tags";
import type { WorkspaceEvent, WorkspaceTag } from "../types";
import { dayMonth, monthCells } from "../utils";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MAX_DOTS = 4;

type Props = {
  tags: WorkspaceTag[];
  month: string;
  today: string;
  selected: string;
  byDay: Map<string, WorkspaceEvent[]>;
  onSelect: (day: string) => void;
  /** Note drag-and-drop: which drags a day accepts and what happens on drop. */
  accepts: (transfer: DataTransfer) => boolean;
  onDrop: (day: string, transfer: DataTransfer) => void;
  onDragStart: (item: WorkspaceEvent, event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
};

export function CalendarMonth({ tags, month, today, selected, byDay, onSelect, accepts, onDrop, onDragStart, onDragEnd }: Props) {
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
              e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed === "move" ? "move" : "copy";
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
              {items.slice(0, MAX_DOTS).map((e) => <i key={e.id} draggable title={e.title} onDragStart={event => onDragStart(e, event)} onDragEnd={onDragEnd} style={tagStyle(tags.find(t => t.id === e.tag))} className="ws-tag-dot" />)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
