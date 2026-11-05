import { DatePicker } from "@/components/ui/date-picker";
import { StyledSelect } from "@/components/ui/styled-select";
﻿import type { RateInput } from "../types";
export function RateDetailsFields({ initial }: { initial: RateInput }) {
  return (
    <>
      <section className="rate-form-section">
        <h3>Phụ phí &amp; phí local</h3>
        <div className="form-grid two">
          <label className="rate-field">
            <span>Phụ phí (USD/cont)</span>
            <input
              name="surcharges"
              maxLength={2000}
              defaultValue={initial.surcharges}
              placeholder="VD: LSS 80"
            />
          </label>
          <label className="rate-field">
            <span>Phụ phí khác</span>
            <input
              name="other_surcharges"
              maxLength={2000}
              placeholder="VD: PSS 50, EBS 30"
            />
          </label>
          <label className="rate-field">
            <span>THC 20&apos; / 40&apos; (USD)</span>
            <input
              name="local_charges"
              maxLength={2000}
              defaultValue={initial.local_charges}
              placeholder="VD: 145 / 210"
            />
          </label>
          <label className="rate-field">
            <span>Bill · Seal · Telex (USD)</span>
            <input
              name="other_local_charges"
              maxLength={2000}
              placeholder="VD: Bill 45 · Seal 10"
            />
          </label>
        </div>
      </section>
      <section className="rate-form-section">
        <h3>Điều kiện &amp; hiệu lực</h3>
        <div className="form-grid three">
          <label className="rate-field">
            <span>Điều kiện</span>
            <StyledSelect
              name="trade_term"
              defaultValue={initial.trade_term || "FOB"}
            >
              <option>FOB</option>
              <option>CIF</option>
              {initial.trade_term &&
                !["FOB", "CIF"].includes(initial.trade_term) && (
                  <option>{initial.trade_term}</option>
                )}
            </StyledSelect>
          </label>
          <label className="rate-field">
            <span>Loại hàng</span>
            <StyledSelect name="cargo_type" defaultValue={initial.cargo_type || "GC"}>
              <option value="GC">Hàng khô (GC)</option>
              <option value="RF">Hàng lạnh (RF)</option>
              <option value="DG">Hàng nguy hiểm (DG)</option>
              {initial.cargo_type &&
                !["GC", "RF", "DG"].includes(initial.cargo_type) && (
                  <option>{initial.cargo_type}</option>
                )}
            </StyledSelect>
          </label>
          <label className="rate-field">
            <span>Transit time (ngày)</span>
            <input
              type="number"
              required
              min="0"
              max="365"
              step="1"
              name="transit_days"
              defaultValue={initial.transit_days}
            />
          </label>
          <DatePicker label="Hiệu lực từ" name="valid_from" required defaultValue={initial.valid_from.slice(0, 10)} />
          <DatePicker label="Hiệu lực đến" name="valid_to" required defaultValue={initial.valid_to.slice(0, 10)} />
          <label className="rate-field">
            <span>Direct / Transit</span>
            <StyledSelect name="service_type" defaultValue={initial.service_type}>
              <option value="direct">Direct</option>
              <option value="transit">Transit</option>
            </StyledSelect>
          </label>
        </div>
      </section>
      <section className="rate-form-section">
        <h3>Ghi chú</h3>
        <label className="rate-field">
          <span>Ghi chú cho khách</span>
          <textarea
            name="public_note"
            rows={2}
            maxLength={4000}
            defaultValue={initial.public_note}
          />
        </label>
        <label className="rate-field private-field">
          <span>Ghi chú nội bộ · khách không thấy</span>
          <textarea
            name="internal_note"
            rows={2}
            maxLength={8000}
            defaultValue={initial.internal_note}
          />
        </label>
      </section>
    </>
  );
}
