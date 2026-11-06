"use client";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCalendar } from "../hooks/use-calendar";
import { useNoteDrop } from "../hooks/use-note-drop";
import { useCalendarDrag } from "../hooks/use-calendar-drag";
import type { WorkspaceEvent, WorkspaceTag } from "../types";
import { monthTitle, shiftMonth } from "../utils";
import { CalendarMonth } from "./calendar-month";
import { DayAgenda } from "./day-agenda";
import { EventDialog } from "./event-dialog";

type Props = { month: string; today: string; events: WorkspaceEvent[]; tags: WorkspaceTag[] };

export function CalendarCard({ month, today, events, tags }: Props) {
  const calendar = useCalendar(month, today, events);
  const noteDrop = useNoteDrop(calendar.select);
  const eventDrag = useCalendarDrag(calendar.select);
  return (
    <section ref={eventDrag.calendarRef} className="card ws-card ws-calendar" aria-labelledby="ws-calendar-title">
      <header className="ws-card-head">
        <h2 id="ws-calendar-title"><CalendarDays size={18} />Lịch làm việc</h2>
        <div className="ws-head-actions">
          <Link className="ws-nav" href={`?month=${shiftMonth(month, -1)}`} scroll={false} aria-label="Tháng trước"><ChevronLeft size={18} /></Link>
          <strong>{monthTitle(month)}</strong>
          <Link className="ws-nav" href={`?month=${shiftMonth(month, 1)}`} scroll={false} aria-label="Tháng sau"><ChevronRight size={18} /></Link>
          <button type="button" className="btn ws-add" onClick={calendar.create}><Plus size={16} />Thêm ghi chú</button>
        </div>
      </header>
      <CalendarMonth tags={tags} month={month} today={today} selected={calendar.selected} byDay={calendar.byDay} onSelect={calendar.select}
        onDragStart={eventDrag.begin} onDragEnd={eventDrag.end}
        accepts={transfer => eventDrag.accepts(transfer) || noteDrop.accepts(transfer)}
        onDrop={(day, transfer) => { if (!eventDrag.drop(day, transfer)) noteDrop.drop(day, transfer); }} />
      <DayAgenda tags={tags} day={calendar.selected} today={today} items={calendar.agenda} onEdit={calendar.edit} onDragStart={eventDrag.begin} onDragEnd={eventDrag.end} />
      {calendar.draft && <EventDialog tags={tags} draft={calendar.draft} onClosed={calendar.closeDraft} />}
    </section>
  );
}
