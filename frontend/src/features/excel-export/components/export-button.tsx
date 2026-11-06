"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { ModalSurface } from "@/components/ui/modal-surface";
import { ExportDialog } from "./export-dialog";
import type { ExportKind } from "../types";

export type ExportButtonProps = {
  kind: ExportKind;
  selectedIds: string[];
  selectedCount: number;
  filters: Record<string, string | undefined>;
  disabled?: boolean;
};

export function ExportButton(props: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="btn2" disabled={props.disabled} onClick={() => setOpen(true)}>
      <Download size={16} />{props.kind === "rates" ? "Xuất báo giá" : "Xuất lịch tàu"}
    </button>
    {open && <ModalSurface className="export-backdrop" label={props.kind === "rates" ? "Xuất báo giá Excel" : "Xuất lịch tàu Excel"} onClosed={() => setOpen(false)}>
      <ExportDialog {...props} />
    </ModalSurface>}
  </>;
}
