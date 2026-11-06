"use client";
import { useState, type FormEvent } from "react";
import { Download, FileSpreadsheet, X } from "lucide-react";
import { ModalClose } from "@/components/ui/modal-close";
import { useModalDismiss } from "@/components/ui/modal-context";
import { useExcelExport } from "../hooks/use-excel-export";
import { templateDetails, type ExportDetails, type ExportScope } from "../types";
import type { ExportButtonProps } from "./export-button";

export function ExportDialog({ kind, selectedIds, selectedCount, filters }: ExportButtonProps) {
  const [scope, setScope] = useState<ExportScope>(selectedIds.length ? "selected" : "filtered");
  const [details, setDetails] = useState<ExportDetails>({ ...templateDetails[kind] });
  const state = useExcelExport(kind), dismiss = useModalDismiss();
  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await state.download({ scope, ids: scope === "selected" ? selectedIds : [], details,
      filters: Object.fromEntries(Object.entries(filters).filter((entry): entry is [string, string] => typeof entry[1] === "string")),
    });
    if (result) dismiss();
  }
  const fields: [keyof Pick<ExportDetails, "client" | "contact" | "address" | "sales">, string][] = [
    ["client", "Tên khách hàng"], ["contact", "Người liên hệ (PIC)"],
    ...(kind === "rates" ? [["address", "Địa chỉ"], ["sales", "Nhân viên kinh doanh"]] as ["address" | "sales", string][] : []),
  ];
  return <form className="export-dialog" onSubmit={submit}>
    <header>
      <div><FileSpreadsheet size={22} /><h2>{kind === "rates" ? "Xuất báo giá Excel" : "Xuất lịch tàu Excel"}</h2></div>
      <ModalClose className="confirm-close" aria-label="Đóng" disabled={state.pending}><X size={18} /></ModalClose>
    </header>
    <div className="export-body">
      <fieldset disabled={state.pending}>
        <legend>Phạm vi xuất</legend>
        <label className={`export-scope ${scope === "selected" ? "active" : ""}`}>
          <input type="radio" name="exportScope" value="selected" checked={scope === "selected"} disabled={!selectedIds.length} onChange={() => setScope("selected")} />
          <span><b>Dòng đã tick · {selectedCount}</b><small>Xuất các dòng đang được chọn trong bảng.</small></span>
        </label>
        <label className={`export-scope ${scope === "filtered" ? "active" : ""}`}>
          <input type="radio" name="exportScope" value="filtered" checked={scope === "filtered"} onChange={() => setScope("filtered")} />
          <span><b>Toàn bộ kết quả đã lọc</b><small>Bao gồm tất cả các trang, áp dụng bộ lọc và từ khóa hiện tại.</small></span>
        </label>
      </fieldset>
      <fieldset className="export-fields" disabled={state.pending}>
        <legend>Thông tin trên file</legend>
        {fields.map(([key, label]) => <label key={key}>{label}<input name={key} value={details[key]} maxLength={500} onChange={e => setDetails({ ...details, [key]: e.target.value })} /></label>)}
        {kind === "rates" && <label>Số lượng container<input name="quantity" type="number" min={1} max={100000} step={1} required value={details.quantity} onChange={e => setDetails({ ...details, quantity: e.target.valueAsNumber })} /></label>}
      </fieldset>
      <p className="export-note">Giữ ảnh, chữ ký và định dạng của file mẫu.{kind === "rates" && " Giá xuất là giá bán; mỗi loại container nằm trên một sheet. Mục phí local và các điều khoản khác giữ theo mẫu."}</p>
    </div>
    <footer>
      <ModalClose className="btn2" disabled={state.pending}>Đóng</ModalClose>
      <button type="submit" className="btn" disabled={state.pending || (scope === "selected" && !selectedIds.length)}><Download size={16} />{state.pending ? "Đang tạo file…" : "Tải file Excel"}</button>
    </footer>
  </form>;
}
