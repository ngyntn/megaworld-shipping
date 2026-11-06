"use client";
import { BookmarkCheck, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/components/feedback/toast-provider";
import { money, shortDate } from "@/lib/format";
import { useDeleteItem } from "../hooks/use-delete-item";
import type { SavedQuote } from "../types";
import { quoteText, savedLabel } from "../utils";

export function SavedQuotesCard({ quotes, today }: { quotes: SavedQuote[]; today: string }) {
  const toast = useToast();
  const removal = useDeleteItem("saved_quotes", {
    title: "Xóa báo giá đã lưu?",
    description: "Báo giá chỉ bị xóa khỏi Không gian của tôi; dòng giá trong bảng giá cước vẫn giữ nguyên.",
  });
  async function copy(quote: SavedQuote) {
    try {
      await navigator.clipboard.writeText(quoteText(quote, money(quote.price_cents)));
      toast("Đã sao chép báo giá.");
    } catch {
      toast("Trình duyệt không cho phép sao chép.", "error");
    }
  }
  return (
    <section className="card ws-card" aria-labelledby="ws-quotes-title">
      <header className="ws-card-head">
        <h2 id="ws-quotes-title"><BookmarkCheck size={18} />Báo giá đã lưu</h2>
        <span className="ws-count">{quotes.length} báo giá</span>
      </header>
      {quotes.length ? (
        <ul className="ws-quotes">
          {quotes.map((q) => (
            <li key={q.id}>
              <div className="ws-quote-main">
                <b>{q.route_label}</b>
                <small>{q.carrier_code} · {q.container_type} · Đến {shortDate(q.valid_to)}</small>
              </div>
              <div className="ws-quote-price">
                <strong>{money(q.price_cents)}</strong>
                <small>Lưu {savedLabel(q.created, today)}</small>
              </div>
              <div className="ws-row-actions">
                <button type="button" className="ws-icon" aria-label="Sao chép báo giá" onClick={() => copy(q)}><Copy size={16} /></button>
                <button type="button" className="ws-icon" aria-label="Xóa báo giá" disabled={removal.pending} onClick={() => removal.remove(q.id)}><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ws-empty">Chưa có báo giá. Bấm biểu tượng lưu ở bảng Quản lý giá cước để thêm.</p>
      )}
    </section>
  );
}
