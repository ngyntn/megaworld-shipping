import { CalendarDays, ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { sampleEvents, sampleUpcoming } from "../sample-data";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Month grid starting on Monday; empty cells pad the first and last week. */
function monthCells(year: number, month: number) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  return [...Array<null>(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
}

export function CalendarCard() {
  const now = new Date();
  const cells = monthCells(now.getFullYear(), now.getMonth());
  return (
    <section className="card ws-card ws-calendar" aria-labelledby="ws-calendar-title">
      <header className="ws-card-head">
        <h2 id="ws-calendar-title"><CalendarDays size={18} />Lịch làm việc</h2>
        <div className="ws-head-actions">
          <button type="button" className="ws-nav" aria-label="Tháng trước"><ChevronLeft size={18} /></button>
          <strong>Tháng {now.getMonth() + 1}/{now.getFullYear()}</strong>
          <button type="button" className="ws-nav" aria-label="Tháng sau"><ChevronRight size={18} /></button>
          <button type="button" className="btn ws-add"><Plus size={16} />Thêm lịch</button>
        </div>
      </header>
      <div className="ws-month" role="grid" aria-label="Lịch tháng">
        {WEEKDAYS.map((d) => <span key={d} className="ws-weekday" role="columnheader">{d}</span>)}
        {cells.map((day, i) => (
          <div key={i} className={`ws-day ${day === null ? "empty" : ""} ${day === now.getDate() ? "today" : ""}`} role="gridcell">
            {day !== null && <b>{day}</b>}
            <span className="ws-dots">
              {sampleEvents.filter((e) => e.day === day).map((e, k) => <i key={k} className={e.tone} />)}
            </span>
          </div>
        ))}
      </div>
      <div className="ws-upcoming">
        <h3>Sắp tới hôm nay</h3>
        <ul>
          {sampleUpcoming.map((item) => (
            <li key={item.time}>
              <span className="ws-time"><Clock size={14} />{item.time}</span>
              <span className="ws-event-title">{item.title}</span>
              <span className={`ws-tag ${item.tone}`}>{item.tag}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
