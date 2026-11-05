"use client";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/feedback/toast-provider";

/** Scroll containers that can be panned by holding the right mouse button. */
const TARGETS = ".rate-table-scroll, .history-table-scroll, .import-table-scroll, .op-table-wrap";
const THRESHOLD = 4;
const DRAGGING = "is-drag-scrolling";
const COPIED = "is-row-copied";
const CELL_COPIED = "is-cell-copied";

/** Flattens a table row into "cell, cell, cell"; empty cells (checkbox, action buttons) are skipped. */
function rowText(row: HTMLTableRowElement) {
  if (row.cells.length === 1 && row.cells[0].colSpan > 1) return "";
  return Array.from(row.cells)
    .map(cellText)
    .filter(Boolean)
    .join(", ");
}

const flashTimers = new WeakMap<HTMLElement, number>();
/** Highlights the copied row/cell for 0.3s, like a hover state. */
function flash(element: HTMLElement, className: string) {
  window.clearTimeout(flashTimers.get(element));
  element.classList.add(className);
  flashTimers.set(element, window.setTimeout(() => element.classList.remove(className), 300));
}

const clean = (value: string | null) => (value || "").replace(/\s+/g, " ").trim();

/** Collects visible text pieces: one per leaf element, consecutive bare text nodes joined together. */
function collect(node: Node, parts: string[]) {
  let buffer = "";
  const flush = () => {
    if (clean(buffer)) parts.push(clean(buffer));
    buffer = "";
  };
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) buffer += child.textContent;
    else if (child instanceof HTMLElement) {
      flush();
      if (child.hasAttribute("data-copy")) parts.push(clean(child.dataset.copy ?? ""));
      else if (child.children.length) collect(child, parts);
      else parts.push(clean(child.innerText || child.textContent));
    }
  }
  flush();
}

/**
 * Full value of a cell, e.g. "Cát Lái → Jebel Ali, CAT_LAI → AEJEA".
 * A `data-copy` attribute on the cell overrides the visible text (for data that is not displayed).
 */
function cellText(cell: HTMLTableCellElement) {
  if (cell.dataset.copy !== undefined) return clean(cell.dataset.copy);
  const parts: string[] = [];
  collect(cell, parts);
  return parts.filter((part, index) => part && part !== parts[index - 1]).join(", ");
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position:fixed;opacity:0";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

/**
 * Lets users pan any table by dragging with the right mouse button.
 * The browser context menu is suppressed only after a real drag, so a plain right click still works.
 * Mount once in the root layout.
 */
export function DragScrollProvider() {
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  useEffect(() => {
    let box: HTMLElement | null = null;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    let dragged = false;
    let suppressMenu = false;
    let timer = 0;

    function onMove(e: MouseEvent) {
      if (!box) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!dragged && Math.hypot(dx, dy) < THRESHOLD) return;
      dragged = true;
      box.classList.add(DRAGGING);
      box.scrollLeft = startLeft - dx;
      box.scrollTop = startTop - dy;
    }
    function end() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp, true);
      box?.classList.remove(DRAGGING);
      if (dragged) {
        // Windows fires `contextmenu` right after mouseup; keep the guard briefly.
        suppressMenu = true;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => { suppressMenu = false; }, 300);
      }
      box = null;
    }
    function onUp(e: MouseEvent) {
      if (e.button === 2) end();
    }
    function onDown(e: MouseEvent) {
      if (e.button !== 2 || !(e.target instanceof Element)) return;
      const found = e.target.closest<HTMLElement>(TARGETS);
      if (!found || (found.scrollWidth <= found.clientWidth && found.scrollHeight <= found.clientHeight)) return;
      box = found;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = found.scrollLeft;
      startTop = found.scrollTop;
      dragged = false;
      suppressMenu = false;
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp, true);
    }
    function onContextMenu(e: MouseEvent) {
      if (suppressMenu) {
        e.preventDefault();
        suppressMenu = false;
        return;
      }
      if (!(e.target instanceof Element)) return;
      const row = e.target.closest<HTMLTableRowElement>("tbody tr");
      if (!row || !row.closest(TARGETS)) return;
      const text = rowText(row);
      if (!text) return;
      e.preventDefault();
      flash(row, COPIED);
      copyText(text).then(
        (ok) => toastRef.current(ok ? "Đã copy dòng dữ liệu." : "Không thể copy dòng dữ liệu.", ok ? undefined : "error"),
      );
    }
    function onDoubleClick(e: MouseEvent) {
      if (e.button !== 0 || !(e.target instanceof Element)) return;
      if (e.target.closest("button, a, input, label, select, textarea, [role='switch'], [role='checkbox']")) return;
      const cell = e.target.closest<HTMLTableCellElement>("tbody td");
      if (!cell || !cell.closest(TARGETS) || cell.colSpan > 1) return;
      const text = cellText(cell);
      if (!text || text === "—") return;
      window.getSelection()?.removeAllRanges();
      flash(cell, CELL_COPIED);
      copyText(text).then((ok) =>
        toastRef.current(ok ? `Đã copy: ${text.length > 60 ? text.slice(0, 60) + "…" : text}` : "Không thể copy ô dữ liệu.", ok ? undefined : "error"),
      );
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("dblclick", onDoubleClick);
    return () => {
      document.removeEventListener("dblclick", onDoubleClick);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("contextmenu", onContextMenu, true);
      window.clearTimeout(timer);
      end();
    };
  }, []);
  return null;
}
