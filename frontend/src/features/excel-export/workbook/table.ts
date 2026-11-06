import type { Document, Element } from "@xmldom/xmldom";
import { DRAWING_NS, cell, elements, merge, moveRef, resetCellIndex, rowNumber, setValue } from "./xml.ts";

type BodyRow = { templateRow: number; values: Record<string, string | number | null>; height?: number };

/** Resize only the data area. All original header/footer cells and drawing objects survive. */
export function fillTable(doc: Document, drawing: Document, start: number, end: number, data: BodyRow[], options: { keepEmptyRows?: boolean } = {}) {
  const sheetData = elements(doc, "sheetData")[0];
  const original = elements(sheetData, "row");
  const templates = new Map(original.map(r => [Number(r.getAttribute("r")), r]));
  const capacity = options.keepEmptyRows === false ? data.length : Math.max(end - start + 1, data.length);
  const delta = capacity - (end - start + 1);
  for (const row of original) {
    const index = Number(row.getAttribute("r"));
    if (index >= start && index <= end) sheetData.removeChild(row);
    else if (index > end) {
      row.setAttribute("r", String(index + delta));
      for (const c of elements(row, "c")) c.setAttribute("r", moveRef(c.getAttribute("r")!, end + 1, delta));
      for (const f of elements(row, "f")) f.textContent = moveRef(f.textContent || "", end + 1, delta);
    }
  }
  const after = elements(sheetData, "row").find(r => Number(r.getAttribute("r")) > start) || null;
  for (let i = 0; i < capacity; i++) {
    const item = data[i];
    const row = templates.get(item?.templateRow ?? start)!.cloneNode(true) as Element;
    row.setAttribute("r", String(start + i));
    row.removeAttribute("hidden");
    if (item?.height) row.setAttribute("ht", String(item.height));
    for (const c of elements(row, "c")) {
      c.setAttribute("r", c.getAttribute("r")!.replace(/\d+$/, String(start + i)));
      while (c.firstChild) c.removeChild(c.firstChild);
      c.removeAttribute("t");
    }
    sheetData.insertBefore(row, after);
  }
  resetCellIndex(doc);
  data.forEach((item, i) => {
    for (const [col, value] of Object.entries(item.values)) setValue(doc, `${col}${start + i}`, value);
  });
  for (const m of elements(doc, "mergeCell")) {
    const ref = m.getAttribute("ref")!;
    const [first, last] = ref.split(":").map(rowNumber);
    if (first >= start && last <= end) m.parentNode!.removeChild(m);
    else m.setAttribute("ref", moveRef(ref, end + 1, delta));
  }
  elements(doc, "mergeCells")[0].setAttribute("count", String(elements(doc, "mergeCell").length));
  const dimension = elements(doc, "dimension")[0];
  if (dimension) dimension.setAttribute("ref", moveRef(dimension.getAttribute("ref")!, end + 1, delta));
  for (const view of elements(doc, "sheetView")) view.setAttribute("topLeftCell", "A1");
  for (const selection of elements(doc, "selection")) {
    selection.setAttribute("activeCell", "A1"); selection.setAttribute("sqref", "A1");
  }
  // Anchors use zero-based row indexes; move both corners of footer shapes/images.
  for (const r of elements(drawing, "row", DRAWING_NS)) {
    const index = Number(r.textContent);
    if (index >= end) r.textContent = String(index + delta);
  }
  return delta;
}

/** Merge only adjacent equal values; unrelated routes/carriers must never share a cell. */
export function mergeGroups<T>(doc: Document, rows: T[], start: number, col: string, key: (row: T) => string) {
  let first = 0;
  while (first < rows.length) {
    let last = first;
    while (last + 1 < rows.length && key(rows[last + 1]) === key(rows[first])) last++;
    if (last > first) {
      merge(doc, `${col}${start + first}:${col}${start + last}`);
      for (let i = first + 1; i <= last; i++) setValue(doc, `${col}${start + i}`, null);
    }
    first = last + 1;
  }
}

export function setCellStyle(doc: Document, ref: string, style: string) { cell(doc, ref).setAttribute("s", style); }
