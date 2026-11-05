"use client";
import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
export function DatePicker({ label, name, value, defaultValue = "", mode = "date", required, min, onValueChange }: { label: string; name: string; value?: string; defaultValue?: string; mode?: "date" | "month"; required?: boolean; min?: string; onValueChange?: (value: string) => void }) {
 const [local, setLocal] = useState(defaultValue); const selected = value ?? local;
 const [open, setOpen] = useState(false);
 const [view, setView] = useState(() => new Date((selected || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })).slice(0, 7) + "-01T12:00:00"));
 const year = view.getFullYear(), month = view.getMonth();
 const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
 const pick = (next: string) => { setLocal(next); onValueChange?.(next); setOpen(false); };
 return <div className="styled-select date-picker" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }} onKeyDown={e => { if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); setOpen(false); } }}>
  <input name={name} value={selected} required={required} onChange={() => {}} className="date-validation" tabIndex={-1} aria-label={label} />
  <button type="button" className="select-trigger" aria-expanded={open} aria-label={label} onClick={() => setOpen(!open)}><span className="select-label">{label}</span><span className="select-value">{selected ? selected.split("-").reverse().join("/") : mode === "month" ? "Tất cả tháng" : "dd/mm/yyyy"}<CalendarDays size={16}/></span></button>
  {open && <div className="select-menu calendar-menu"><div className="calendar-heading"><button type="button" aria-label="Previous" onClick={() => setView(new Date(year - (mode === "month" ? 1 : 0), month - (mode === "date" ? 1 : 0), 1))}><ChevronLeft size={16}/></button><b>{mode === "date" ? `${month + 1} / ` : ""}{year}</b><button type="button" aria-label="Next" onClick={() => setView(new Date(year + (mode === "month" ? 1 : 0), month + (mode === "date" ? 1 : 0), 1))}><ChevronRight size={16}/></button></div>
  <div className={mode === "month" ? "month-grid" : "day-grid"}>{mode === "date" && ["T2","T3","T4","T5","T6","T7","CN"].map(d => <small key={d}>{d}</small>)}{mode === "date" && Array.from({length: (new Date(year,month,1).getDay()+6)%7}, (_, i) => <span key={`blank${i}`}/>)}{Array.from({ length: mode === "month" ? 12 : new Date(year, month + 1, 0).getDate() }, (_, i) => { const next = mode === "month" ? `${year}-${String(i+1).padStart(2,"0")}` : `${prefix}-${String(i+1).padStart(2,"0")}`; return <button type="button" key={next} disabled={!!min && next < min.slice(0, next.length)} className={selected === next ? "on" : ""} onClick={() => pick(next)}>{mode === "month" ? `Tháng ${i+1}` : i+1}</button>; })}</div>
  <button type="button" onClick={() => pick("")}>Xóa bộ lọc</button></div>}
 </div>;
}
