import { useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { LogoUpload } from "./logo-upload";
import { Field } from "@/features/operations/components/shared";
import type { Carrier, Port } from "@/features/operations/types";
export function CatalogForm({
  kind,
  selected,
  pending,
  save,
  cancel,
}: {
  kind: "carriers" | "ports";
  selected?: Carrier | Port;
  pending: boolean;
  save: (f: FormData) => void;
  cancel: () => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  const port = selected as Port | undefined,
    carrier = selected as Carrier | undefined;
  return (
    <form
      ref={form}
      className="card op-form"
      key={kind + (selected?.id || "new")}
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        for (const k of ["active", "can_be_pol", "can_be_pod"])
          f.set(k, f.get(k) === "on" ? "true" : "false");
        save(f);
      }}
    >
      <h2>
        {selected ? "Sửa" : "Thêm"} {kind === "carriers" ? "hãng tàu" : "cảng"}
        {selected ? `: ${selected.code}` : ""}
      </h2>
      {kind === "carriers" && <LogoUpload code={carrier?.code} currentUrl={carrier?.logoUrl} />}
      <Field label={kind === "carriers" ? "Mã hãng" : "Mã cảng nội bộ"}>
        <input
          name="code"
          required
          maxLength={20}
          defaultValue={selected?.code}
        />
      </Field>
      <Field label={kind === "carriers" ? "Tên đầy đủ" : "Tên cảng"}>
        <input
          name="name"
          required
          maxLength={160}
          defaultValue={selected?.name}
        />
      </Field>
      {kind === "ports" && (
        <>
          <Field label="UN/LOCODE">
            <input
              name="unlocode"
              maxLength={5}
              defaultValue={port?.unlocode}
            />
          </Field>
          <Field label="Quốc gia (mã 2 ký tự)">
            <input
              name="country_code"
              required
              pattern="[A-Z]{2}"
              maxLength={2}
              defaultValue={port?.country_code}
            />
          </Field>
          <Field label="Khu vực">
            <input name="region" maxLength={80} defaultValue={port?.region} />
          </Field>
          <Checkbox
            labelClassName="op-check"
            name="can_be_pol"
            defaultChecked={port?.can_be_pol}
            label="Cảng đi (POL · Việt Nam)"
          />
          <Checkbox
            labelClassName="op-check"
            name="can_be_pod"
            defaultChecked={port?.can_be_pod}
            label="Cảng đến (POD)"
          />
        </>
      )}
      <Checkbox
        labelClassName="op-check"
        name="active"
        defaultChecked={selected?.active ?? true}
        label="Hiển thị cho khách"
      />
      <div className="op-actions">
        <button disabled={pending} className="btn">
          Lưu
        </button>
        <button
          type="button"
          className="btn2"
          disabled={pending}
          onClick={() => {
            form.current?.reset();
            cancel();
          }}
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
