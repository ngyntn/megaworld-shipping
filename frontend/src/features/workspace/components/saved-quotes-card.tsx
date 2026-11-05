import { BookmarkCheck, Copy, Trash2 } from "lucide-react";
import { sampleQuotes } from "../sample-data";

export function SavedQuotesCard() {
  return (
    <section className="card ws-card" aria-labelledby="ws-quotes-title">
      <header className="ws-card-head">
        <h2 id="ws-quotes-title"><BookmarkCheck size={18} />Báo giá đã lưu</h2>
        <span className="ws-count">{sampleQuotes.length} báo giá</span>
      </header>
      <ul className="ws-quotes">
        {sampleQuotes.map((q) => (
          <li key={q.route}>
            <div className="ws-quote-main">
              <b>{q.route}</b>
              <small>{q.carrier} · {q.container} · {q.valid}</small>
            </div>
            <div className="ws-quote-price">
              <strong>{q.price}</strong>
              <small>Lưu {q.saved}</small>
            </div>
            <div className="ws-row-actions">
              <button type="button" className="ws-icon" aria-label="Sao chép báo giá"><Copy size={16} /></button>
              <button type="button" className="ws-icon" aria-label="Xóa báo giá"><Trash2 size={16} /></button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
