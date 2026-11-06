/**
 * One line of the board. Bullet lines keep their text without the leading "- ".
 * Image lines carry a (shrunken) data URL in `img` and no text.
 */
export type Line = { b: boolean; t: string; img?: string };

/** Personal notes store plain text; keep line breaks and list markers. */
export function boardNoteText(lines: Line[]) {
  return lines.filter(line => !line.img).map(line => line.b ? `- ${line.t}` : line.t).join("\n").trim();
}

/** "1. " / "12. " at the start of a line marks a heading. */
export const HEADING = /^\s*\d+\.\s/;
/** "- " at the start of a line becomes a bullet. */
export const BULLET = /^-\s/;

/** Only the current board is kept (no history); a new board overwrites it. */
const KEY = "megaworld.whiteboard.v1";

export function loadBoard(): Line[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const data: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) return [];
    return data
      .filter((line): line is Line => !!line && typeof line.t === "string")
      .map((line) => ({
        b: !!line.b,
        t: line.t,
        ...(typeof line.img === "string" && line.img.startsWith("data:image/") ? { img: line.img } : {}),
      }));
  } catch {
    return [];
  }
}

export const isEmptyBoard = (lines: Line[]) => lines.every((line) => !line.b && !line.img && !line.t.trim());

/** Returns false when the browser refused to store the board (quota exceeded or storage blocked). */
export function saveBoard(lines: Line[]) {
  try {
    if (isEmptyBoard(lines)) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(lines));
    return true;
  } catch {
    return false;
  }
}
