import { LockKeyhole } from "lucide-react";
import { money } from "@/lib/format";
import { containers } from "../types";
import { usdToCents } from "../schemas/rate-input";
import type { useRateForm } from "../hooks/use-rate-form";
export function PriceGrid({
  state,
}: {
  state: ReturnType<typeof useRateForm>;
}) {
  const {
    mode,
    setMode,
    costs,
    setCosts,
    profits,
    setProfits,
    effectiveMargin,
  } = state;
  return (
    <section className="rate-form-section">
      <div className="form-section-heading">
        <h3>Giá gốc · lợi nhuận · giá bán (USD)</h3>
        <span className="private-label">
          <LockKeyhole size={13} />
          Chỉ Admin thấy giá gốc
        </span>
      </div>
      <div className="margin-controls">
        <div
          className="margin-segments"
          role="group"
          aria-label="Cách tính lợi nhuận"
        >
          {[
            ["route", "Lợi nhuận theo tuyến"],
            ["row", "Theo từng dòng"],
            ["default", "Mặc định"],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              aria-pressed={mode === key}
              className={mode === key ? "on" : ""}
              onClick={() => setMode(key as typeof mode)}
            >
              {label}
            </button>
          ))}
        </div>
        {mode !== "row" && (
          <label className="route-margin">
            Lãi / cont
            <input
              className="price-input"
              aria-label="Lợi nhuận cấu hình"
              value={effectiveMargin == null ? "" : effectiveMargin / 100}
              readOnly
            />
          </label>
        )}
      </div>
      <div className="price-grid price-grid-heading">
        <span>Container</span>
        <span>Giá gốc (từ sếp)</span>
        <span>Lợi nhuận</span>
        <span>Giá bán (khách thấy)</span>
      </div>
      {containers.map((c) => {
        let sell = "—";
        try {
          const margin =
            mode === "row" ? usdToCents(profits[c] || "0") : effectiveMargin;
          if (costs[c]?.trim() && margin != null)
            sell = money(usdToCents(costs[c]) + margin);
        } catch {
          /* Input feedback appears when submitting. */
        }
        return (
          <div className="price-grid" key={c}>
            <b>{c}</b>
            <input
              className="price-input"
              type="number"
              min="0"
              step="0.01"
              max="10000000"
              aria-label={`Giá gốc ${c}`}
              value={costs[c] || ""}
              onChange={(e) => setCosts({ ...costs, [c]: e.target.value })}
            />
            <input
              className="price-input"
              type="number"
              min="0"
              step="0.01"
              max="10000000"
              aria-label={`Lợi nhuận ${c}`}
              disabled={mode !== "row"}
              value={
                mode === "row"
                  ? profits[c] || ""
                  : effectiveMargin == null
                    ? ""
                    : effectiveMargin / 100
              }
              onChange={(e) => setProfits({ ...profits, [c]: e.target.value })}
            />
            <output className="price-output">{sell}</output>
          </div>
        );
      })}
      <div className="price-grid unsupported-container">
        <b>45HC</b>
        <span>—</span>
        <span>—</span>
        <output>—</output>
      </div>
      <p className="form-hint">
        Để trống giá gốc để giữ nguyên giá hiện có; container chưa có giá sẽ
        hiển thị “—”. 45HC chưa được hỗ trợ.
      </p>
      {mode !== "row" && (
        <p className="form-hint">
          Lãi lấy từ cấu hình{" "}
          {mode === "route"
            ? "tuyến, hoặc mặc định nếu tuyến chưa có lãi riêng"
            : "mặc định"}
          . Chọn “Theo từng dòng” để nhập lãi riêng cho đợt giá này.
        </p>
      )}
    </section>
  );
}
