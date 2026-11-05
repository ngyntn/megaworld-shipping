import { lineOf } from "./editor-dom";

/**
 * The native caret is hidden (CSS) and replaced by `caret`, so it can fade smoothly and glide
 * between positions. Coordinates are relative to the scroll container the caret lives in.
 */
export function updateCaret(editor: HTMLElement, scroll: HTMLElement, caret: HTMLElement) {
  const selection = window.getSelection();
  const visible =
    !!selection?.rangeCount &&
    selection.isCollapsed &&
    document.activeElement === editor &&
    editor.contains(selection.anchorNode);
  if (!visible || !selection) {
    caret.hidden = true;
    return;
  }
  if (lineOf(editor, selection.anchorNode)?.dataset.img) {
    caret.hidden = true;
    return;
  }
  const range = selection.getRangeAt(0);
  let rect: { left: number; top: number; height: number } | undefined = Array.from(range.getClientRects()).find(
    (r) => r.height > 0,
  );
  if (!rect) {
    // Empty lines report no rect; fall back to the line box.
    const line = lineOf(editor, selection.anchorNode);
    if (!line) {
      caret.hidden = true;
      return;
    }
    const box = line.getBoundingClientRect();
    const style = getComputedStyle(line);
    rect = { left: box.left + parseFloat(style.paddingLeft || "0"), top: box.top, height: Math.min(box.height, parseFloat(style.fontSize) * 1.35) };
  }
  const frame = scroll.getBoundingClientRect();
  const x = rect.left - frame.left + scroll.scrollLeft;
  const y = rect.top - frame.top + scroll.scrollTop;
  const wasHidden = Boolean(caret.hidden);
  caret.hidden = false;
  // First appearance snaps into place; later moves glide.
  caret.classList.toggle("snap", wasHidden);
  caret.style.height = `${rect.height}px`;
  caret.style.transform = `translate(${x}px, ${y}px)`;
  // Stay solid while typing/moving, then resume the fade.
  caret.getAnimations().forEach((animation) => {
    animation.cancel();
    animation.play();
  });
}
