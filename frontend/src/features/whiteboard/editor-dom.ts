import { BULLET, HEADING, type Line } from "./utils";

/**
 * Tiny line-based plain-text editor helpers. The editor is a contenteditable whose children are
 * `div.wb-line` blocks; bullet state lives in `data-bullet`, heading state in the `wb-h` class.
 */
export const LINE = "wb-line";
export const HEADING_CLASS = "wb-h";

const br = () => document.createElement("br");

export function makeLine(text = "", bullet = false) {
  const el = document.createElement("div");
  el.className = LINE;
  if (bullet) el.dataset.bullet = "1";
  el.append(text ? document.createTextNode(text) : br());
  return el;
}

/** A pasted picture: fixed-size, rounded, not editable as text. */
export function makeImageLine(src: string) {
  const el = document.createElement("div");
  el.className = `${LINE} wb-img`;
  el.dataset.img = src;
  el.contentEditable = "false";
  const img = document.createElement("img");
  img.src = src;
  img.alt = "Ảnh đã dán";
  img.draggable = false;
  el.append(img);
  return el;
}

export function render(editor: HTMLElement, lines: Line[]) {
  const source: Line[] = lines.length ? lines : [{ b: false, t: "" }];
  editor.replaceChildren(...source.map((line) => (line.img ? makeImageLine(line.img) : makeLine(line.t, line.b))));
  applyRules(editor);
}

export function read(editor: HTMLElement): Line[] {
  return Array.from(editor.children).map((el) => {
    const line = el as HTMLElement;
    if (line.dataset.img) return { b: false, t: "", img: line.dataset.img };
    return { b: line.dataset.bullet === "1", t: (el.textContent ?? "").replace(/ /g, " ") };
  });
}

export const selectedImage = (editor: HTMLElement) => editor.querySelector<HTMLElement>(".wb-img.selected");

export function clearImageSelection(editor: HTMLElement) {
  selectedImage(editor)?.classList.remove("selected");
}

/** Puts a picture after `anchor` (or replaces it when it is an empty line) and moves on to a text line. */
export function insertImageLine(editor: HTMLElement, anchor: HTMLElement | null, src: string) {
  const image = makeImageLine(src);
  const base = anchor && editor.contains(anchor) ? anchor : (editor.lastElementChild as HTMLElement | null);
  if (!base) editor.append(image);
  else if (!base.dataset.img && !base.dataset.bullet && !base.textContent) base.replaceWith(image);
  else base.after(image);
  const next = image.nextElementSibling as HTMLElement | null;
  if (!next || next.dataset.img) image.after(makeLine());
  placeCaret(image.nextElementSibling as HTMLElement, 0);
  return image;
}

/** Removes a picture line and puts the caret on the line that followed it. */
export function removeImageLine(editor: HTMLElement, line: HTMLElement) {
  const next = (line.nextElementSibling ?? line.previousElementSibling) as HTMLElement | null;
  line.remove();
  normalize(editor);
  const target = next && editor.contains(next) ? next : (editor.firstElementChild as HTMLElement | null);
  if (target) placeCaret(target, 0);
}

/** The browser may leave stray text or <br> directly under the editor (select all + delete). */
export function normalize(editor: HTMLElement) {
  if (!editor.firstChild) {
    editor.append(makeLine());
    return;
  }
  for (const node of Array.from(editor.childNodes)) {
    if (node instanceof HTMLDivElement) {
      node.classList.add(LINE);
    } else if (node instanceof HTMLBRElement) {
      node.replaceWith(makeLine());
    } else {
      const line = document.createElement("div");
      line.className = LINE;
      node.replaceWith(line);
      line.append(node);
    }
  }
}

export function lineOf(editor: HTMLElement, node: Node | null): HTMLElement | null {
  const element = node instanceof Element ? node : node?.parentElement;
  const line = element?.closest<HTMLElement>(`.${LINE}`);
  return line && editor.contains(line) ? line : null;
}

export function placeCaret(line: HTMLElement, offset: number) {
  const text = line.firstChild;
  const range = document.createRange();
  if (text instanceof Text) range.setStart(text, Math.min(offset, text.length));
  else range.setStart(line, 0);
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function caretOffset(line: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !line.contains(selection.anchorNode)) return null;
  const range = document.createRange();
  range.selectNodeContents(line);
  range.setEnd(selection.anchorNode!, selection.anchorOffset);
  return range.toString().length;
}

/** Applies the board rules to every line: "1. " → heading, "- " → bullet. */
export function applyRules(editor: HTMLElement) {
  for (const line of Array.from(editor.children) as HTMLElement[]) {
    if (line.dataset.img) continue;
    const text = line.textContent ?? "";
    line.classList.toggle(HEADING_CLASS, HEADING.test(text));
    if (!line.dataset.bullet && BULLET.test(text)) {
      const offset = caretOffset(line);
      const rest = text.replace(BULLET, "");
      line.replaceChildren(rest ? document.createTextNode(rest) : br());
      line.dataset.bullet = "1";
      line.classList.toggle(HEADING_CLASS, HEADING.test(rest));
      if (offset !== null) placeCaret(line, Math.max(0, offset - (text.length - rest.length)));
    }
  }
}

export function atLineStart(line: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selection.isCollapsed) return false;
  const range = document.createRange();
  range.selectNodeContents(line);
  range.setEnd(selection.anchorNode!, selection.anchorOffset);
  return range.toString() === "";
}

/** Enter: splits the line at the caret. Enter on an empty bullet line ends the list. */
export function enterAtCaret(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  const line = lineOf(editor, range.startContainer);
  if (!line || line.dataset.img) return;
  if (!range.collapsed) range.deleteContents();
  if (line.dataset.bullet && !line.textContent) {
    delete line.dataset.bullet;
    placeCaret(line, 0);
    return;
  }
  const tail = document.createRange();
  tail.setStart(range.endContainer, range.endOffset);
  if (line.lastChild) tail.setEndAfter(line.lastChild);
  const next = makeLine();
  const rest = tail.extractContents();
  if (rest.textContent) next.replaceChildren(rest);
  if (!line.textContent) line.replaceChildren(br());
  if (line.dataset.bullet) next.dataset.bullet = "1";
  line.after(next);
  placeCaret(next, 0);
}

/** Inserts pasted plain text, one editor line per text line. */
export function insertPlain(editor: HTMLElement, text: string) {
  text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .forEach((part, index) => {
      if (index > 0) enterAtCaret(editor);
      if (part) document.execCommand("insertText", false, part);
    });
}
