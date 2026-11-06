import type { EventCategory, NoteKind } from "../types";

export type EventInput = { title: string; day: string; time: string; category: EventCategory };
export type NoteInput = { title: string; body: string; kind: NoteKind };

const CATEGORIES: readonly string[] = ["customer", "rate", "schedule", "other"];
const KINDS: readonly string[] = ["quote", "customer", "schedule", "reminder", "other"];
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export function isDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseEventInput(form: FormData): EventInput {
  const title = text(form, "title");
  const day = text(form, "day");
  const time = text(form, "time");
  const category = text(form, "category");
  if (!title) throw new Error("Nhập nội dung lịch.");
  if (title.length > 200) throw new Error("Nội dung lịch tối đa 200 ký tự.");
  if (!isDay(day)) throw new Error("Chọn ngày hợp lệ.");
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Giờ phải theo dạng HH:MM.");
  if (!CATEGORIES.includes(category)) throw new Error("Chọn loại lịch hợp lệ.");
  return { title, day, time, category: category as EventCategory };
}

/** Notes autosave as plain objects; an empty title is allowed as long as the note has some text. */
export function parseNoteInput(input: unknown): NoteInput {
  const value = (input ?? {}) as Record<string, unknown>;
  const field = (key: string) => (typeof value[key] === "string" ? (value[key] as string).trim() : "");
  const title = field("title");
  const body = field("body");
  const kind = field("kind");
  if (!title && !body) throw new Error("Ghi chú đang trống.");
  if (title.length > 120) throw new Error("Tiêu đề ghi chú tối đa 120 ký tự.");
  if (body.length > 2000) throw new Error("Nội dung ghi chú tối đa 2000 ký tự.");
  if (!KINDS.includes(kind)) throw new Error("Chọn loại ghi chú hợp lệ.");
  return { title, body, kind: kind as NoteKind };
}
