"use client";
import { useRateModals } from "../hooks/use-rate-modals";
import type { getRateHistory } from "../services/history";
import { money, shortDate } from "@/lib/format";

type Row = Awaited<ReturnType<typeof getRateHistory>>["items"][number];

export function HistoryRow({ row }: { row: Row }) {
  const modals = useRateModals();
  const difference = row.old == null ? null : row.sell - row.old;
  const tone = difference == null || difference === 0 ? "neutral" : difference < 0 ? "decrease" : "increase";
  const change = difference == null ? "Đợt đầu" : difference === 0 ? "Không đổi" : `${difference < 0 ? "▼" : "▲"} ${money(Math.abs(difference))}`;
  return <tr className={row.current ? "history-current" : ""}>
    <td><b>Đợt {row.revision}</b><small><span className={`rate-status ${row.current ? "valid" : "neutral"}`}>{row.current ? "Hiện hành" : "Lịch sử"}</span></small></td>
    <td className="history-nowrap">{shortDate(row.from)} – {shortDate(row.to)}<small>{row.to.slice(0, 4)}</small></td>
    <td className="history-nowrap">{row.old == null ? "—" : money(row.old)}</td>
    <td className="history-nowrap"><b className="sell-price">{money(row.sell)}</b></td>
    <td className="history-nowrap">{row.cost == null ? "—" : <>{money(row.cost)} <span className="muted">+ {money(row.margin || 0)}</span></>}</td>
    <td><span className={`change-badge ${tone}`}>{change}</span></td>
    <td>{row.schedules.length ? row.schedules.map((schedule, index) => <div key={index} className="history-schedule"><b>{schedule.vessel_name} · {schedule.voyage}</b><small>ETD {shortDate(schedule.etd)} · ETA {shortDate(schedule.eta)} · {schedule.service_type}</small></div>) : "—"}</td>
    <td>{row.note ? <span className="internal-note">{row.note}</span> : <span className="muted">—</span>}</td>
    <td><button type="button" className="btn2" disabled={modals.loading} onClick={() => modals.open({ kind: "editor", id: row.id, duplicate: true })}>Nhân bản</button></td>
  </tr>;
}
