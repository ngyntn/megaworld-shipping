"use client";
import { Pencil, Image as ImageIcon } from "lucide-react";
import { CarrierLogo } from "@/components/ui/carrier-logo";
import { Checkbox } from "@/components/ui/checkbox";
import type { Carrier } from "@/features/operations/types";
import type { useRowSelection } from "@/features/bulk-delete/hooks/use-row-selection";

type Props = {
  rows: Carrier[];
  selection: ReturnType<typeof useRowSelection>;
  pending: boolean;
  onToggle: (id: string, active: boolean) => void;
  onEdit: (carrier: Carrier) => void;
};

export function CarriersTable({ rows, selection, pending, onToggle, onEdit }: Props) {
  return (
    <table className="op-table op-master">
      <thead>
        <tr>
          <th className="op-check-col">
            <Checkbox size="sm" aria-label="Chọn tất cả hãng tàu" checked={selection.allSelected} onChange={(e) => selection.toggleAll(e.target.checked)} />
          </th>
          {["Logo", "Mã", "Tên đầy đủ", "Dòng giá", "Hiển thị", ""].map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((c) => (
          <tr key={c.id}>
            <td className="op-check-col">
              <Checkbox size="sm" aria-label={`Chọn hãng ${c.code}`} checked={selection.isSelected(c.id)} onChange={(e) => selection.toggle(c.id, e.target.checked)} />
            </td>
            <td>
              <CarrierLogo size="lg" code={c.code} name={c.name} logoUrl={c.logoUrl} />
            </td>
            <td>
              <b>{c.code}</b>
            </td>
            <td>{c.name}</td>
            <td>{c.rateCount}</td>
            <td>
              <button role="switch" aria-checked={c.active} aria-label={"Hiển thị " + c.code} className="op-toggle" disabled={pending} onClick={() => onToggle(c.id, !c.active)}>
                <span />
              </button>
            </td>
            <td>
              <div className="op-actions">
                <button className="op-icon" aria-label={"Sửa " + c.code} onClick={() => onEdit(c)}>
                  <Pencil size={16} />
                </button>
                <button className="op-icon" aria-label={"Đổi logo " + c.code} onClick={() => onEdit(c)}>
                  <ImageIcon size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
