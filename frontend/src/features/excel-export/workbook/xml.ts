import { DOMParser, XMLSerializer, type Document, type Element } from "@xmldom/xmldom";

export const SHEET_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
export const DRAWING_NS = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing";
export const REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships";
export const DOC_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
export const parseXml = (xml: string) => new DOMParser().parseFromString(xml, "application/xml");
export const serializeXml = (doc: Document) => new XMLSerializer().serializeToString(doc);
export const elements = (node: Document | Element, name: string, ns = SHEET_NS): Element[] => Array.from(node.getElementsByTagNameNS(ns, name));
const cellIndexes = new WeakMap<Document, Map<string, Element>>();
export const resetCellIndex = (doc: Document) => cellIndexes.delete(doc);

export function cell(doc: Document, ref: string): Element {
  let index = cellIndexes.get(doc);
  if (!index) {
    index = new Map(elements(doc, "c").map(c => [c.getAttribute("r")!, c]));
    cellIndexes.set(doc, index);
  }
  const found = index.get(ref);
  if (!found) throw new Error(`Missing template cell ${ref}`);
  return found;
}

export function setValue(doc: Document, ref: string, value: string | number | null) {
  const c = cell(doc, ref);
  while (c.firstChild) c.removeChild(c.firstChild);
  c.removeAttribute("t");
  if (value === null || value === "") return;
  if (typeof value === "number") {
    const v = doc.createElementNS(SHEET_NS, "v");
    v.textContent = String(value);
    c.appendChild(v);
  } else {
    // Inline strings keep user text literal, including leading =, +, - or @.
    c.setAttribute("t", "inlineStr");
    const inline = doc.createElementNS(SHEET_NS, "is");
    const t = doc.createElementNS(SHEET_NS, "t");
    t.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
    t.textContent = value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
    inline.appendChild(t);
    c.appendChild(inline);
  }
}

/** Edit text inside the existing rich-text runs, preserving their individual fonts. */
export function replaceRichText(doc: Document, strings: Document, ref: string, from: string, to: string) {
  const c = cell(doc, ref);
  if (c.getAttribute("t") !== "s") return;
  const index = Number(elements(c, "v")[0]?.textContent);
  const source = elements(strings, "si")[index];
  const inline = doc.createElementNS(SHEET_NS, "is");
  for (const node of Array.from(source.childNodes)) inline.appendChild(doc.importNode(node, true));
  const runs = elements(inline, "t");
  const full = runs.map(t => t.textContent || "").join("");
  const start = full.indexOf(from);
  if (start < 0) throw new Error(`Missing template text ${ref}`);
  let offset = 0;
  for (const t of runs) {
    const text = t.textContent || "", end = offset + text.length;
    if (offset < start + from.length && end > start) {
      t.textContent = text.slice(0, Math.max(0, start - offset)) + (offset <= start ? to : "") + text.slice(Math.max(0, start + from.length - offset));
    }
    offset = end;
  }
  while (c.firstChild) c.removeChild(c.firstChild);
  c.setAttribute("t", "inlineStr");
  c.appendChild(inline);
}

export const rowNumber = (ref: string) => Number(ref.match(/\d+$/)![0]);
export function moveRef(ref: string, first: number, delta: number) {
  return ref.replace(/(\$?[A-Z]+\$?)(\d+)/g, (_, col: string, row: string) => `${col}${Number(row) >= first ? Number(row) + delta : row}`);
}

export function merge(doc: Document, ref: string) {
  const parent = elements(doc, "mergeCells")[0];
  const item = doc.createElementNS(SHEET_NS, "mergeCell");
  item.setAttribute("ref", ref);
  parent.appendChild(item);
  parent.setAttribute("count", String(Number(parent.getAttribute("count") || 0) + 1));
}
