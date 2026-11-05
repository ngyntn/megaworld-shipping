"use client";
import { Pagination } from "@/components/ui/pagination";
import { DatePicker } from "@/components/ui/date-picker";
import { StyledSelect } from "@/components/ui/styled-select";
import { useState } from "react";
import { Pencil, CalendarX2, Upload } from "lucide-react";
import { ModalSurface } from "@/components/ui/modal-surface";
import { ScheduleImportDialog } from "./schedule-import-dialog";
import { CarrierLogo } from "@/components/ui/carrier-logo";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectionBar } from "@/features/bulk-delete/components/selection-bar";
import { useBulkDelete } from "@/features/bulk-delete/hooks/use-bulk-delete";
import { useRowSelection } from "@/features/bulk-delete/hooks/use-row-selection";
import {
  ModuleHeader,
} from "@/features/operations/components/shared";
import { useSchedules } from "../hooks/use-schedules";
import { ScheduleForm } from "./schedule-form";
import type {
  OperationsCatalog,
  SchedulePage,
} from "@/features/operations/types";
const day = (value: string) => {
  const [year, month, date] = value.slice(0, 10).split("-");
  return year && month && date ? `${date}/${month}` : "—";
};
export function SchedulesView({
  name,
  catalog,
  initial,
}: {
  name: string;
  catalog: OperationsCatalog;
  initial: SchedulePage;
}) {
  const s = useSchedules(initial, catalog),
    [search, setSearch] = useState(""),
    [month, setMonth] = useState(""),
    [importing, setImporting] = useState(false);
  const rows = s.list.items.filter((r) =>
    `${r.vessel_name} ${r.voyage} ${r.route.pol.name} ${r.route.pod.name} ${r.carrier.code}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const selection = useRowSelection(rows.map((r) => r.id));
  const bulk = useBulkDelete("schedules", () => {
    selection.clear();
    s.refresh(s.query);
  });
  return (
    <>
      <ModuleHeader
        name={name}
        placeholder="Tìm tàu, chuyến, tuyến…"
        onSearch={setSearch}
      />
      <div className="op-content">
        <div className="op-title">
          <div>
            <h1>Quản lý lịch tàu</h1>
            <p>Nhập tay từng chuyến · transit time tự tính từ ETD và ETA</p>
          </div>
          <button type="button" className="btn2" onClick={() => setImporting(true)}>
            <Upload size={16} />
            Import Excel
          </button>
        </div>
        <div className="op-columns">
          <ScheduleForm state={s} catalog={catalog} />
          <section className="card op-list" aria-label="Danh sách chuyến">
            <div className="op-list-heading">
              <h2>
                Danh sách chuyến · {s.list.total} chuyến
              </h2>
              <div className="schedule-filters">
                <StyledSelect label="POL" value={s.query.pol || ""} options={[{ value: "", label: "Tất cả POL" }, ...catalog.ports.filter(p => p.can_be_pol).map(p => ({ value: p.id, label: p.name }))]} onValueChange={value => s.filter("pol", value)} />
                <DatePicker label="Tháng" name="month" mode="month" value={month} onValueChange={value => { setMonth(value); s.filterMonth(value); }} />
                <StyledSelect label="Trạng thái" value={s.query.status || ""} options={[{ value: "", label: "Tất cả" }, { value: "scheduled", label: "Đã lên lịch" }, { value: "cancelled", label: "Đã hủy" }]} onValueChange={value => s.filter("status", value)} />
              </div>
            </div>
            <SelectionBar
              count={selection.selected.length}
              scope="trên trang này"
              pending={bulk.pending}
              onDelete={() =>
                bulk.remove({ ids: selection.selected, count: selection.selected.length, all: selection.allSelected })
              }
            />
            <div className="op-table-wrap">
              <table className="op-table op-schedules">
                <thead>
                  <tr>
                    <th className="op-check-col">
                      <Checkbox size="sm" aria-label="Chọn tất cả chuyến" checked={selection.allSelected} onChange={(e) => selection.toggleAll(e.target.checked)} />
                    </th>
                    {[
                      "Hãng",
                      "Tàu / chuyến",
                      "Tuyến",
                      "ETD",
                      "ETA",
                      "Transit",
                      "Loại",
                      "Trạng thái",
                      "",
                    ].map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="op-check-col">
                        <Checkbox size="sm" aria-label={`Chọn chuyến ${r.vessel_name}`} checked={selection.isSelected(r.id)} onChange={(e) => selection.toggle(r.id, e.target.checked)} />
                      </td>
                      <td>
                        <CarrierLogo size="sm" code={r.carrier.code} name={r.carrier.name} logoUrl={r.carrier.logoUrl} />
                      </td>
                      <td>
                        <b>{r.vessel_name}</b>
                        <small>{r.voyage}</small>
                      </td>
                      <td data-copy={`${r.route.pol.name} → ${r.route.pod.name}, ${r.route.pol.code} → ${r.route.pod.code}`}>
                        {r.route.pol.name} → {r.route.pod.name}
                      </td>
                      <td>
                        <b>{day(r.etd)}</b>
                      </td>
                      <td>{day(r.eta)}</td>
                      <td>{r.transit_days} ngày</td>
                      <td>
                        <span
                          className={
                            "op-badge " +
                            (r.service_type === "direct" ? "green" : "")
                          }
                        >
                          {r.service_type === "direct" ? "Direct" : "Transit"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            "op-badge " +
                            (r.status === "cancelled" ? "red" : "")
                          }
                        >
                          {r.status === "cancelled"
                            ? "Đã hủy"
                            : r.departure_status === "departed"
                              ? "Đã chạy"
                              : "Sắp chạy"}
                        </span>
                      </td>
                      <td>
                        <div className="op-actions">
                          <button
                            className="op-icon"
                            aria-label={"Sửa chuyến " + r.vessel_name}
                            disabled={s.pending || r.status === "cancelled"}
                            onClick={() => s.edit(r)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="op-icon"
                            aria-label={"Hủy chuyến " + r.vessel_name}
                            disabled={s.pending || r.status === "cancelled"}
                            onClick={() => s.cancel(r)}
                          >
                            <CalendarX2 size={16} color="#B3261E" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={10} className="op-empty">
                        Không có chuyến phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="op-pagination"><Pagination page={s.list.page} pages={s.list.pages} pending={s.pending} onPageChange={page => s.refresh({ ...s.query, page: String(page) })} /></div>
            {search && (
              <p className="muted" style={{ padding: 12, fontSize: 12 }}>
                Tìm kiếm trong trang kết quả hiện tại.
              </p>
            )}
          </section>
        </div>
      </div>
      {importing && (
        <ModalSurface className="import-backdrop" label="Import Excel" onClosed={() => setImporting(false)}>
          <ScheduleImportDialog onImported={() => s.refresh(s.query)} />
        </ModalSurface>
      )}
    </>
  );
}
