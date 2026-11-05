"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CircleCheck, CircleX, Info, X } from "lucide-react";

type Tone = "success" | "info" | "error";
type Notice = { id: number; message: string; tone: Tone };
type Notify = (message: string, tone?: Tone) => void;
const ToastContext = createContext<Notify>(() => {});
export const useToast = () => useContext(ToastContext);

/**
 * success / info: the message is the title.
 * error: a fixed title with the message as the explanation underneath.
 */
const TONES: Record<Tone, { icon: typeof Info; title?: string; duration: number }> = {
  success: { icon: CircleCheck, duration: 5000 },
  info: { icon: Info, duration: 6000 },
  error: { icon: CircleX, title: "Đã có lỗi xảy ra", duration: 8000 },
};

function Toast({ notice, dismiss }: { notice: Notice; dismiss: (id: number) => void }) {
  const tone = TONES[notice.tone];
  const Icon = tone.icon;
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(notice.id), tone.duration);
    return () => window.clearTimeout(timer);
  }, [notice.id, tone.duration, dismiss]);
  return (
    <article className={`toast toast-${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
      <Icon className="toast-icon" size={22} strokeWidth={2.2} aria-hidden />
      <div className="toast-body">
        <strong>{tone.title ?? notice.message}</strong>
        {tone.title && <p>{notice.message}</p>}
      </div>
      <button type="button" aria-label="Đóng thông báo" onClick={() => dismiss(notice.id)}>
        <X size={18} />
      </button>
    </article>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const counter = useRef(0);
  const viewport = useRef<HTMLDivElement>(null);
  const dismiss = useCallback((id: number) => setNotices(items => items.filter(item => item.id !== id)), []);
  const notify = useCallback<Notify>((message, tone = "success") => {
    if (message) setNotices(items => [...items.slice(-2), { id: ++counter.current, message, tone }]);
  }, []);
  useEffect(() => {
    // A manual popover puts notifications above native modal dialogs as well.
    const element = viewport.current;
    if (notices.length) element?.showPopover();
    else element?.hidePopover();
  }, [notices]);
  return <ToastContext value={notify}>{children}<div ref={viewport} popover="manual" className="toast-viewport" aria-label="Thông báo">{notices.map(notice => <Toast key={notice.id} notice={notice} dismiss={dismiss} />)}</div></ToastContext>;
}
