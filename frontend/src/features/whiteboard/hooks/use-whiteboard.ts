"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { updateCaret } from "../caret";
import {
  applyRules,
  atLineStart,
  clearImageSelection,
  enterAtCaret,
  insertImageLine,
  insertPlain,
  lineOf,
  normalize,
  placeCaret,
  read,
  removeImageLine,
  render,
  selectedImage,
} from "../editor-dom";
import { pastedImage, shrinkImage } from "../image";
import { isEmptyBoard, loadBoard, saveBoard } from "../utils";

const SAVE_DELAY = 250;
type Notify = (message: string, tone?: "error") => void;

/** Wires the line editor: rules, Enter/Backspace/paste handling, pictures, custom caret and persistence. */
export function useWhiteboard(notify: Notify) {
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(true);
  const [zoom, setZoom] = useState<string | null>(null);
  const timer = useRef(0);
  const notifyRef = useRef(notify);
  const saveFailed = useRef(false);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  /** Saves the board now; returns false when the browser storage refused it. */
  const persist = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return true;
    const lines = read(editor);
    const ok = saveBoard(lines);
    setEmpty(isEmptyBoard(lines));
    return ok;
  }, []);

  useEffect(() => {
    const editor = editorRef.current!;
    const scroll = scrollRef.current!;
    const caret = caretRef.current!;
    const save = () => {
      const ok = persist();
      // Tell the user once per failure streak instead of on every keystroke.
      if (!ok && !saveFailed.current) notifyRef.current("Bộ nhớ trình duyệt đã đầy, nội dung mới chưa được lưu.", "error");
      saveFailed.current = !ok;
    };
    const schedule = () => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(save, SAVE_DELAY);
    };
    const moveCaret = () => updateCaret(editor, scroll, caret);
    const changed = () => {
      normalize(editor);
      applyRules(editor);
      schedule();
      moveCaret();
    };

    render(editor, loadBoard());
    setEmpty(isEmptyBoard(read(editor)));
    editor.focus();
    const last = editor.lastElementChild as HTMLElement | null;
    if (last && !last.dataset.img) placeCaret(last, last.textContent?.length ?? 0);
    moveCaret();

    async function addImage(file: File, anchor: HTMLElement | null) {
      try {
        const src = await shrinkImage(file);
        const line = insertImageLine(editor, anchor, src);
        if (!persist()) {
          line.remove();
          normalize(editor);
          notifyRef.current("Bộ nhớ trình duyệt đã đầy, không thể thêm ảnh.", "error");
        }
        changed();
      } catch {
        notifyRef.current("Không thể đọc ảnh đã dán.", "error");
      }
    }

    const onInput = (event: Event) => {
      if ((event as InputEvent).isComposing) return;
      clearImageSelection(editor);
      changed();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (event.key === "Backspace" || event.key === "Delete") {
        const picked = selectedImage(editor);
        if (picked) {
          event.preventDefault();
          removeImageLine(editor, picked);
          changed();
          return;
        }
      }
      if (event.key === "Enter") {
        event.preventDefault();
        enterAtCaret(editor);
        changed();
        return;
      }
      if (event.key === "Backspace") {
        const line = lineOf(editor, window.getSelection()?.anchorNode ?? null);
        if (!line || !atLineStart(line)) return;
        const previous = line.previousElementSibling as HTMLElement | null;
        if (line.dataset.bullet) {
          // Backspace at the start of a bullet removes the bullet first, like a list.
          event.preventDefault();
          delete line.dataset.bullet;
          changed();
        } else if (previous?.dataset.img) {
          // Backspace right after a picture removes the picture.
          event.preventDefault();
          removeImageLine(editor, previous);
          changed();
        }
      }
    };
    const onPaste = (event: ClipboardEvent) => {
      event.preventDefault();
      const image = pastedImage(event.clipboardData);
      if (image) {
        addImage(image, lineOf(editor, window.getSelection()?.anchorNode ?? null));
        return;
      }
      insertPlain(editor, event.clipboardData?.getData("text/plain") ?? "");
      changed();
    };
    const onClick = (event: MouseEvent) => {
      clearImageSelection(editor);
      const picture = event.target instanceof Element ? event.target.closest<HTMLElement>(".wb-img") : null;
      if (!picture) return;
      // The picture stays selected behind the viewer, so Backspace/Delete still removes it afterwards.
      picture.classList.add("selected");
      setZoom(picture.dataset.img ?? null);
    };
    const onBlur = () => {
      caret.hidden = true;
      save();
    };

    editor.addEventListener("input", onInput);
    editor.addEventListener("compositionend", changed);
    editor.addEventListener("keydown", onKeyDown);
    editor.addEventListener("paste", onPaste);
    editor.addEventListener("click", onClick);
    editor.addEventListener("focus", moveCaret);
    editor.addEventListener("blur", onBlur);
    document.addEventListener("selectionchange", moveCaret);
    return () => {
      editor.removeEventListener("input", onInput);
      editor.removeEventListener("compositionend", changed);
      editor.removeEventListener("keydown", onKeyDown);
      editor.removeEventListener("paste", onPaste);
      editor.removeEventListener("click", onClick);
      editor.removeEventListener("focus", moveCaret);
      editor.removeEventListener("blur", onBlur);
      document.removeEventListener("selectionchange", moveCaret);
      window.clearTimeout(timer.current);
      saveBoard(read(editor));
    };
  }, [persist]);

  /** Starts a new board: the old content (text and pictures) is discarded, not archived. */
  const clear = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    render(editor, []);
    persist();
    saveFailed.current = false;
    editor.focus();
    placeCaret(editor.firstElementChild as HTMLElement, 0);
  }, [persist]);

  const closeZoom = useCallback(() => {
    setZoom(null);
    editorRef.current?.focus();
  }, []);

  return { editorRef, scrollRef, caretRef, empty, clear, zoom, closeZoom };
}
