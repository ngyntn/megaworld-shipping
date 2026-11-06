"use client";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCalendar } from "../hooks/use-calendar";
import { useNoteDrop } from "../hooks/use-note-drop";
import type { WorkspaceEvent } from "../types";
import { monthTitle, shiftMonth } from "../utils";
import { CalendarMonth } from "./calendar-month";
import { DayAgenda } from "./day-agenda";
import { EventDialog } from "./event-dialog";

type Props = { month: string; today: string; events: WorkspaceEvent[] };

export function CalendarCard({ month, today, events }: Props) {
  const calendar = useCalendar(month, today, events);
  const noteDrop = useNoteDrop(calendar.select);
  return (
    <section className="card ws-card ws-calendar" aria-labelledby="ws-calendar-title">
      <header className="ws-card-head">
        <h2 id="ws-calendar-title"><CalendarDays size={18} />Lịch làm việc</h2>
        <div className="ws-head-actions">
          <Link className="ws-nav" href={`?month=${shiftMonth(month, -1)}`} scroll={false} aria-label="Tháng trước"><ChevronLeft size={18} /></Link>
          <strong>{monthTitle(month)}</strong>
          <Link className="ws-nav" href={`?month=${shiftMonth(month, 1)}`} scroll={false} aria-label="Tháng sau"><ChevronRight size={18} /></Link>
          <button type="button" className="btn ws-add" onClick={calendar.create}><Plus size={16} />Thêm lịch</button>
        </div>
      </header>
      <CalendarMonth month={month} today={today} selected={calendar.selected} byDay={calendar.byDay} onSelect={calendar.select} accepts={noteDrop.accepts} onDrop={noteDrop.drop} />
      <DayAgenda day={calendar.selected} today={today} items={calendar.agenda} onEdit={calendar.edit} />
      {calendar.draft && <EventDialog draft={calendar.draft} onClosed={calendar.closeDraft} />}
    </section>
  );
}
