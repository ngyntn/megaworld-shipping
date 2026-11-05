"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type Options = {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  /** Ask for the 6-digit admin PIN; the promise then resolves with the typed PIN. */
  pin?: boolean;
};
/** false = cancelled; true = confirmed; string = confirmed with this PIN (when `pin` is set). */
type Answer = boolean | string;
const ConfirmContext = createContext<(options: Options) => Promise<Answer>>(async () => false);
export const useConfirm = () => useContext(ConfirmContext);
const PIN_LENGTH = 6;

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<Options | null>(null);
  const [pin, setPin] = useState("");
  const resolver = useRef<((answer: Answer) => void) | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useCallback((next: Options) => new Promise<Answer>(resolve => {
    resolver.current?.(false);
    resolver.current = resolve;
    setPin("");
    setOptions(next);
  }), []);
  const finish = useCallback((answer: Answer) => {
    dialog.current?.close();
    resolver.current?.(answer);
    resolver.current = null;
    setOptions(null);
  }, []);
  const accept = () => {
    if (!options?.pin) return finish(true);
    if (pin.length === PIN_LENGTH) finish(pin);
  };
  useEffect(() => {
    if (!options) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    // showModal() focuses the first control (the close button); move focus to the intended one.
    dialog.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => { dialog.current?.close(); previous?.focus(); };
  }, [options]);
  useEffect(() => () => resolver.current?.(false), []);
  return <ConfirmContext value={request}>{children}
    <dialog ref={dialog} className="confirm-dialog" aria-labelledby="confirm-title" aria-describedby="confirm-description" onCancel={event => { if (event.target !== event.currentTarget) return; event.preventDefault(); finish(false); }} onClick={event => { if (event.target === dialog.current) { const rect = dialog.current.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) finish(false); } }}>
      {options && <><header><h2 id="confirm-title">{options.title}</h2><button type="button" className="confirm-close" aria-label="Đóng" onClick={() => finish(false)}><X size={18} /></button></header>
      <p id="confirm-description">{options.description}</p>
      {options.pin && <label className="confirm-pin">
        <span>Nhập mã PIN để xác nhận</span>
        <input type="password" inputMode="numeric" autoComplete="off" data-autofocus maxLength={PIN_LENGTH} value={pin} aria-label="Mã PIN"
          onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); accept(); } }} />
      </label>}
      <footer><button type="button" className="btn2" data-autofocus={options.pin ? undefined : true} onClick={() => finish(false)}>Quay lại</button><button type="button" className={options.destructive ? "btn confirm-destructive" : "btn"} disabled={!!options.pin && pin.length !== PIN_LENGTH} onClick={accept}>{options.confirmLabel || "Xác nhận"}</button></footer></>}
    </dialog>
  </ConfirmContext>;
}
