"use client";
import { Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Port } from "@/features/operations/types";
import type { useRowSelection } from "@/features/bulk-delete/hooks/use-row-selection";

type Props = {
  rows: Port[];
  selection: ReturnType<typeof useRowSelection>;
  pending: boolean;
  onToggle: (id: string, active: boolean) => void;
  onEdit: (port: Port) => void;
};

export function PortsTable({ rows, selection, pending, onToggle, onEdit }: Props) {
  return (
    <table className="op-table op-master">
      <thead>
        <tr>
          <th className="op-check-col">
            <Checkbox size="sm" aria-label="Chọn tất cả cảng" checked={selection.allSelected} onChange={(e) => selection.toggleAll(e.target.checked)} />
          </th>
          {["Tên cảng", "UN/LOCODE", "Quốc gia", "Khu vực", "Vai trò", "Hiển thị", ""].map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id}>
            <td className="op-check-col">
              <Checkbox size="sm" aria-label={`Chọn cảng ${p.name}`} checked={selection.isSelected(p.id)} onChange={(e) => selection.toggle(p.id, e.target.checked)} />
            </td>
            <td>
              <b>{p.name}</b>
              <small>{p.code}</small>
            </td>
            <td>{p.unlocode || "—"}</td>
            <td>{p.country_code}</td>
            <td>{p.region}</td>
            <td>
              <span className={"op-badge " + (p.can_be_pol ? "green" : "")}>
                {[p.can_be_pol ? "POL" : "", p.can_be_pod ? "POD" : ""].filter(Boolean).join(" / ") || "—"}
              </span>
            </td>
            <td>
              <button role="switch" aria-checked={p.active} aria-label={"Hiển thị " + p.name} className="op-toggle" disabled={pending} onClick={() => onToggle(p.id, !p.active)}>
                <span />
              </button>
            </td>
            <td>
              <button className="op-icon" aria-label={"Sửa " + p.name} onClick={() => onEdit(p)}>
                <Pencil size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
