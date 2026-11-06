"use client";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useModalDismiss } from "@/components/ui/modal-context";
import { money } from "@/lib/format";
import { saveQuote } from "../actions";
import { useWorkspaceAction } from "../hooks/use-workspace-action";
import type { QuoteOption } from "../types";
import { WorkspaceDialog } from "./workspace-dialog";

type Props = { label: string; options: QuoteOption[] };

/** Rates table action: saves one container price to "Không gian của tôi"; asks which one when the row has several. */
export function SaveQuoteButton({ label, options }: Props) {
  const [choosing, setChoosing] = useState(false);
  const { pending, run } = useWorkspaceAction({ refresh: false });
  return (
    <>
      <button
        type="button"
        className="ic"
        aria-label="Lưu báo giá vào Không gian của tôi"
        title="Lưu báo giá"
        disabled={pending || !options.length}
        onClick={() => (options.length === 1 ? run(() => saveQuote(options[0].id)) : setChoosing(true))}
      >
        <Bookmark size={16} />
      </button>
      {choosing && (
        <WorkspaceDialog title="Lưu báo giá" onClosed={() => setChoosing(false)}>
          <ContainerChoice label={label} options={options} />
        </WorkspaceDialog>
      )}
    </>
  );
}

function ContainerChoice({ label, options }: Props) {
  const dismiss = useModalDismiss();
  const { pending, run } = useWorkspaceAction({ refresh: false });
  return (
    <div className="ws-form">
      <p className="ws-dialog-hint">{label} · Chọn loại container cần lưu</p>
      <div className="ws-choices">
        {options.map((option) => (
          <button key={option.id} type="button" className="ws-choice" disabled={pending} onClick={() => run(() => saveQuote(option.id), dismiss)}>
            <b>{option.container_type}</b>
            <strong>{money(option.sell_price_cents)}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
