import { Plus, StickyNote } from "lucide-react";
import { sampleNotes } from "../sample-data";

export function NotesCard() {
  return (
    <section className="card ws-card" aria-labelledby="ws-notes-title">
      <header className="ws-card-head">
        <h2 id="ws-notes-title"><StickyNote size={18} />Ghi chú cá nhân</h2>
        <button type="button" className="btn2 ws-add"><Plus size={16} />Ghi chú mới</button>
      </header>
      <div className="ws-notes">
        {sampleNotes.map((note) => (
          <article key={note.title} className={`ws-note ${note.tone}`}>
            <h3>{note.title}</h3>
            <p>{note.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
