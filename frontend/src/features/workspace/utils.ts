import type { EventCategory, NoteKind, SavedQuote, WorkspaceNote } from "./types";

export const categoryMeta: Record<EventCategory, { label: string; tone: string }> = {
  customer: { label: "Khách hàng", tone: "blue" },
  rate: { label: "Giá cước", tone: "green" },
  schedule: { label: "Lịch tàu", tone: "amber" },
  other: { label: "Khác", tone: "gray" },
};

/** Fixed note types; `category` is used when a note is dropped on the calendar. */
export const noteKindMeta: Record<NoteKind, { label: string; category: EventCategory }> = {
  quote: { label: "Báo giá", category: "rate" },
  customer: { label: "Khách", category: "customer" },
  schedule: { label: "Lịch tàu", category: "schedule" },
  reminder: { label: "Nhắc việc", category: "other" },
  other: { label: "Khác", category: "other" },
};

/** Drag payload type for dropping a note on a calendar day. */
export const NOTE_MIME = "application/x-megaworld-note";
const EVENT_TITLE_MAX = 200;

/** "Title: line 1, line 2" on a single line, fitting the calendar title limit. */
export function noteEventTitle(note: Pick<WorkspaceNote, "title" | "body">) {
  const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();
  const title = oneLine(note.title);
  const body = note.body.split(/\r?\n/).map(oneLine).filter(Boolean).join(", ");
  const text = title && body ? `${title}: ${body}` : title || body;
  return text.length > EVENT_TITLE_MAX ? text.slice(0, EVENT_TITLE_MAX - 1) + "…" : text;
}

export const isMonthKey = (value?: string): value is string =>
  !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && value >= "1900-01";

const pad = (n: number) => String(n).padStart(2, "0");

/** First and last YYYY-MM-DD of a YYYY-MM month. */
export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  return { start: `${month}-01`, end: `${month}-${pad(new Date(Date.UTC(y, m, 0)).getUTCDate())}` };
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

export const monthTitle = (month: string) => `Tháng ${Number(month.slice(5))}/${month.slice(0, 4)}`;

/** Month grid starting on Monday; null cells pad the first week. */
export function monthCells(month: string): (string | null)[] {
  const [y, m] = month.split("-").map(Number);
  const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [...Array<null>(offset).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${pad(i + 1)}`)];
}

/** dd/mm from YYYY-MM-DD. */
export const dayMonth = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/** Vietnam calendar day of a PocketBase timestamp ("2026-11-06 03:00:00.000Z"). */
export function vietnamDay(timestamp: string) {
  const date = new Date(timestamp.includes("T") ? timestamp : timestamp.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

export function savedLabel(created: string, today: string) {
  const day = vietnamDay(created);
  if (!day) return "—";
  if (day === today) return "Hôm nay";
  const yesterday = new Date(Date.parse(today + "T00:00:00Z") - 86400000).toISOString().slice(0, 10);
  return day === yesterday ? "Hôm qua" : dayMonth(day);
}

export function quoteText(quote: SavedQuote, price: string) {
  const validTo = quote.valid_to.split("-").reverse().join("/");
  return `${quote.route_label} | ${quote.carrier_code} | ${quote.container_type}: ${price} | Hiệu lực đến ${validTo}`;
}
