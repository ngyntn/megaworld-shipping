import { DatePicker } from "@/components/ui/date-picker";
import { StyledSelect } from "@/components/ui/styled-select";
import type { OperationsCatalog } from "@/features/operations/types";
import type { useSchedules } from "../hooks/use-schedules";
import { Field } from "@/features/operations/components/shared";
type State = ReturnType<typeof useSchedules>;
export function ScheduleForm({
  state: s,
  catalog,
}: {
  state: State;
  catalog: OperationsCatalog;
}) {
  const f = s.input;
  const set = (key: keyof typeof f, value: string) =>
    s.setInput({ ...f, [key]: value });
  const days =
    f.etd && f.eta
      ? Math.round((Date.parse(f.eta) - Date.parse(f.etd)) / 86400000)
      : null;
  return (
    <form
      className="card op-form"
      onSubmit={(e) => {
        e.preventDefault();
        s.save(false);
      }}
    >
      <h2>{s.editing ? "Sửa chuyến tàu" : "Thêm chuyến tàu"}</h2>
      <Field label="Hãng tàu">
        <StyledSelect
          required
          value={f.carrier}
          onChange={(e) => set("carrier", e.target.value)}
        >
          <option value="">Chọn hãng tàu</option>
          {catalog.carriers
            .filter((c) => c.active)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
        </StyledSelect>
      </Field>
      <div className="op-grid">
        <Field label="POL">
          <StyledSelect
            required
            value={s.pol}
            onChange={(e) => s.setPol(e.target.value)}
          >
            <option value="">Chọn cảng đi</option>
            {catalog.ports
              .filter((p) => p.active && p.can_be_pol)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </StyledSelect>
        </Field>
        <Field label="POD">
          <StyledSelect
            required
            value={s.pod}
            onChange={(e) => s.setPod(e.target.value)}
          >
            <option value="">Chọn cảng đến</option>
            {catalog.ports
              .filter((p) => p.active && p.can_be_pod)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </StyledSelect>
        </Field>
        <Field label="Tên tàu">
          <input
            required
            maxLength={160}
            value={f.vessel_name}
            onChange={(e) => set("vessel_name", e.target.value)}
          />
        </Field>
        <Field label="Số chuyến">
          <input
            maxLength={80}
            value={f.voyage}
            onChange={(e) => set("voyage", e.target.value)}
          />
        </Field>
        <DatePicker label="ETD" name="etd" required value={f.etd} onValueChange={value => set("etd", value)} />
        <DatePicker label="ETA" name="eta" required min={f.etd} value={f.eta} onValueChange={value => set("eta", value)} />
        <Field label="Direct / Transit">
          <StyledSelect
            value={f.service_type}
            onChange={(e) => set("service_type", e.target.value)}
          >
            <option value="direct">Direct</option>
            <option value="transit">Transit</option>
          </StyledSelect>
        </Field>
        <Field label="Cảng chuyển tải">
          <input
            required={f.service_type === "transit"}
            placeholder="Nếu Transit"
            maxLength={160}
            value={f.transshipment_port}
            onChange={(e) => set("transshipment_port", e.target.value)}
          />
        </Field>
      </div>
      <div className="op-transit">
        <span>Transit time</span>
        <b>{days !== null && days >= 0 ? `${days} ngày` : "—"}</b>
      </div>
      <div className="op-actions">
        <button className="btn" disabled={s.pending}>
          Lưu chuyến
        </button>
        <button
          className="btn2"
          disabled={s.pending}
          type="submit"
          onClick={(e) => {
            if (e.currentTarget.form?.checkValidity()) {
              e.preventDefault();
              s.save(true);
            }
          }}
        >
          Lưu & thêm tiếp
        </button>
      </div>
      {s.editing && (
        <button type="button" className="btn2" onClick={s.reset}>
          Hủy chỉnh sửa
        </button>
      )}
    </form>
  );
}
