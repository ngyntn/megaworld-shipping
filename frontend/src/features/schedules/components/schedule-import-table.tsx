import type { ScheduleImportPreview } from "../types";
const day = (value: string) => value.split("-").reverse().join("/");
type Row = {
  row: number;
  message: string;
  action: string;
  item?: ScheduleImportPreview["items"][number];
};
export function buildRows(preview: ScheduleImportPreview): Row[] {
  return [
    ...preview.items.map((item) => ({ row: item.row, message: "", action: item.action, item })),
    ...preview.errors.map((e) => ({ row: e.row, message: e.message, action: "error" })),
  ].sort((a, b) => a.row - b.row);
}
export function ScheduleImportTable({ rows }: { rows: Row[] }) {
  return (
    <div className="import-table-scroll">
      <table className="import-table">
        <thead>
          <tr>
            {["Dòng", "Hãng", "Tuyến", "Tàu / chuyến", "ETD", "ETA", "Loại", "Kết quả kiểm tra"].map((t) => (
              <th key={t}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ row, message, action, item }) => (
            <tr key={row} className={message ? "expired-row" : ""}>
              <td>#{row}</td>
              <td><b>{item?.carrier ?? "—"}</b></td>
              <td>{item?.route ?? "—"}</td>
              <td>{item ? <><b>{item.vessel_name}</b> {item.voyage}</> : "—"}</td>
              <td>{item ? <b>{day(item.etd)}</b> : "—"}</td>
              <td>{item ? day(item.eta) : "—"}</td>
              <td>{item ? (item.service_type === "direct" ? "Direct" : "Transit") : "—"}</td>
              <td>
                <span className={`import-result ${message ? "import-error" : action === "new" ? "valid" : "neutral"}`}>
                  {message || (action === "new" ? "Mới" : "Cập nhật chuyến hiện có")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
