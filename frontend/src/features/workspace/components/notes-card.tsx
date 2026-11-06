"use client";
import { useState } from "react";
import { Plus, StickyNote } from "lucide-react";
import type { WorkspaceNote } from "../types";
import { NOTE_MIME, noteKindMeta } from "../utils";
import { NoteDialog } from "./note-dialog";

/** `undefined` = closed, `null` = new note, otherwise the note being edited. */
type Editing = WorkspaceNote | null | undefined;

export function NotesCard({ notes }: { notes: WorkspaceNote[] }) {
  const [editing, setEditing] = useState<Editing>();
  return (
    <section className="card ws-card" aria-labelledby="ws-notes-title">
      <header className="ws-card-head">
        <h2 id="ws-notes-title"><StickyNote size={18} />Ghi chú cá nhân</h2>
        <button type="button" className="btn2 ws-add" onClick={() => setEditing(null)}><Plus size={16} />Ghi chú mới</button>
      </header>
      {notes.length ? (
        <>
          <div className="ws-notes">
            {notes.map((note) => <NoteCard key={note.id} note={note} onOpen={() => setEditing(note)} />)}
          </div>
          <p className="ws-hint">Kéo ghi chú vào một ngày trên lịch để tạo lịch làm việc.</p>
        </>
      ) : (
        <p className="ws-empty">Chưa có ghi chú. Bấm “Ghi chú mới” để thêm.</p>
      )}
      {editing !== undefined && <NoteDialog note={editing ?? undefined} onClosed={() => setEditing(undefined)} />}
    </section>
  );
}

function NoteCard({ note, onOpen }: { note: WorkspaceNote; onOpen: () => void }) {
  const label = noteKindMeta[note.kind].label;
  return (
    <article
      className={`ws-note ${note.kind}`}
      role="button"
      tabIndex={0}
      draggable
      aria-label={`Sửa ghi chú ${label}: ${note.title || note.body.slice(0, 40)}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData(NOTE_MIME, JSON.stringify({ title: note.title, body: note.body, kind: note.kind }));
      }}
    >
      <span className="ws-note-kind">{label}</span>
      {note.title && <h3>{note.title}</h3>}
      {note.body && <p>{note.body}</p>}
    </article>
  );
}
