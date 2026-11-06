"use client";
import { useState } from "react";
import type { HTMLAttributes } from "react";
import { Plus, StickyNote } from "lucide-react";
import { tagStyle } from "../tags";
import type { WorkspaceNote, WorkspaceTag } from "../types";
import { useNoteDrag } from "../hooks/use-note-drag";
import { NoteDialog } from "./note-dialog";

/** `undefined` = closed, `null` = new note, otherwise the note being edited. */
type Editing = WorkspaceNote | null | undefined;

export function NotesCard({ notes, tags }: { notes: WorkspaceNote[]; tags: WorkspaceTag[] }) {
  const [editing, setEditing] = useState<Editing>();
  const drag = useNoteDrag();
  return (
    <section ref={drag.regionRef} className="card ws-card" aria-labelledby="ws-notes-title">
      <header className="ws-card-head">
        <h2 id="ws-notes-title"><StickyNote size={18} />Ghi chú cá nhân</h2>
        <button type="button" className="btn2 ws-add" onClick={() => setEditing(null)}><Plus size={16} />Ghi chú mới</button>
      </header>
      {notes.length ? (
        <>
          <div className="ws-notes">
            {notes.map((note) => <NoteCard key={note.id} note={note} tag={tags.find(t => t.id === note.tag)} onOpen={() => setEditing(note)} dragProps={drag.cardProps(note)} dropTarget={drag.target === note.id} />)}
          </div>
          <p className="ws-hint">Kéo ghi chú vào một ngày trên lịch để tạo lịch làm việc.</p>
        </>
      ) : (
        <p className="ws-empty">Chưa có ghi chú. Bấm “Ghi chú mới” để thêm.</p>
      )}
      {editing !== undefined && <NoteDialog tags={tags} note={editing ?? undefined} onClosed={() => setEditing(undefined)} />}
    </section>
  );
}

function NoteCard({ note, tag, onOpen, dragProps, dropTarget }: { note: WorkspaceNote; tag?: WorkspaceTag; onOpen: () => void; dragProps: HTMLAttributes<HTMLElement>; dropTarget: boolean }) {
  const label = tag?.name ?? "Không gắn nhãn";
  return (
    <article
      {...dragProps}
      className={`ws-note${dropTarget ? " ws-note-drop-target" : ""}`}
      style={tagStyle(tag)}
      role="button"
      tabIndex={0}
      aria-label={`Sửa ghi chú ${label}: ${note.title || note.body.slice(0, 40)}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <span className="ws-note-kind">{label}</span>
      {note.title && <h3>{note.title}</h3>}
      {note.body && <p>{note.body}</p>}
    </article>
  );
}
