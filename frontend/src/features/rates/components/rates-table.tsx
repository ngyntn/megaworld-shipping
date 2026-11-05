"use client";
import { useRateModals } from "../hooks/use-rate-modals";
import { Pencil, Copy, History } from "lucide-react";
import { CarrierLogo } from "@/components/ui/carrier-logo";
import { Checkbox } from "@/components/ui/checkbox";
import { money, shortDate, timestamp } from "@/lib/format";
import type { RateList } from "../types";
import type { useRateList } from "../hooks/use-rate-list";
export function RatesTable({
  data,
  state,
}: {
  data: RateList;
  state: ReturnType<typeof useRateList>;
}) {
  const { rows, selected, setSelected, showCost } = state;
  const modals = useRateModals();
  return (
    <div
      className="rate-table-scroll"
      tabIndex={0}
      aria-label="Bảng giá cuộn ngang"
    >
      <table className="rate-table">
        <colgroup>
          {[
            44, 150, 190, 150, 150, 150, 150, 130, 64, 160, 116, 210, 110, 186,
          ].map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {[
              "",
              "Hãng tàu",
              "Tuyến",
              "20GP",
              "40GP",
              "40HC",
              "45HC",
              "Phụ phí",
              "ĐK",
              "Validity",
              "Trạng thái",
              "Ghi chú nội bộ",
              "Cập nhật",
              "Thao tác",
            ].map((label, i) => (
              <th key={i}>
                {i === 0 ? (
                  <Checkbox
                    size="sm"
                    aria-label="Chọn tất cả"
                    checked={rows.length > 0 && selected.length === rows.length}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? rows.map((r) => r[0].id) : [],
                      )
                    }
                  />
                ) : (
                  label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((group) => {
            const r = group[0],
              expired = r.valid_to < data.today,
              upcoming = r.valid_from > data.today;
            const soon =
              !expired &&
              !upcoming &&
              (Date.parse(r.valid_to) - Date.parse(data.today)) / 86400000 <=
                data.warningDays;
            const status = !r.is_current
              ? "Lịch sử"
              : expired
                ? "Hết hạn"
                : upcoming
                  ? "Chưa hiệu lực"
                  : soon
                    ? "Sắp hết hạn"
                    : "Hiện hành";
            return (
              <tr key={r.id} className={expired ? "expired-row" : ""}>
                <td>
                  <Checkbox
                    size="sm"
                    aria-label={`Chọn ${r.carrierCode} ${r.pol} ${r.pod}`}
                    checked={selected.includes(r.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, r.id]
                          : selected.filter((id) => id !== r.id),
                      )
                    }
                  />
                </td>
                <td>
                  <div className="rate-carrier">
                    <CarrierLogo size="sm" code={r.carrierCode} name={r.carrierName} logoUrl={r.carrierLogoUrl} />
                    <b>{r.carrierCode}</b>
                  </div>
                </td>
                <td>
                  <b>
                    {r.pol} → {r.pod}
                  </b>
                  <small>
                    {r.polCode} → {r.podCode}
                  </small>
                </td>
                {["20GP", "40GP", "40HC", "45HC"].map((c) => {
                  const line = group.find((x) => x.container_type === c);
                  return (
                    <td key={c} className="price-cell">
                      <strong className="sell-price">
                        {line ? money(line.sell_price_cents) : "—"}
                      </strong>
                      {showCost && line && (
                        <small className="cost-price">
                          Gốc {money(line.cost_price_cents)} +{" "}
                          {money(line.margin_cents)}
                        </small>
                      )}
                    </td>
                  );
                })}
                <td>{r.surcharges || "—"}</td>
                <td>
                  <b>{r.trade_term || "—"}</b>
                </td>
                <td>
                  {shortDate(r.valid_from)} – {shortDate(r.valid_to)}/
                  {r.valid_to.slice(0, 4)}
                </td>
                <td>
                  <span
                    className={`rate-status ${!r.is_current || upcoming ? "neutral" : expired ? "expired" : soon ? "soon" : "valid"}`}
                  >
                    {status}
                  </span>
                </td>
                <td>
                  {r.internal_note && (
                    <span className="internal-note">{r.internal_note}</span>
                  )}
                </td>
                <td>
                  <small>{timestamp(r.created)}</small>
                </td>
                <td>
                  <div className="rate-row-actions">
                    <button
                      type="button"
                      className="ic"
                      aria-label="Sửa"
                      onClick={() => modals.open({ kind: "editor", id: r.id })}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="ic"
                      aria-label="Nhân bản rồi chỉnh"
                      onClick={() => modals.open({ kind: "editor", id: r.id, duplicate: true })}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      type="button"
                      className="ic"
                      aria-label="Lịch sử giá"
                      onClick={() => modals.open({ kind: "history", series: r.series })}
                    >
                      <History size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && (
        <p className="empty-state rate-empty">
          Không có giá phù hợp với bộ lọc.
        </p>
      )}
    </div>
  );
}
