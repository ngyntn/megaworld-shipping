import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import type { Document } from "@xmldom/xmldom";
import { DOC_REL_NS, REL_NS, SHEET_NS, elements, parseXml, serializeXml } from "./xml.ts";

const CONTENT_NS = "http://schemas.openxmlformats.org/package/2006/content-types";
export type TemplateSheet = { name: string; sheet: Document; drawing: Document; printArea?: string };

/** Preserve the template ZIP parts, including original image bytes, fonts, rich text and shapes. */
export function templatePackage(template: Uint8Array) {
  const files = unzipSync(template);
  const read = (path: string) => parseXml(strFromU8(files[path]));
  function styleVariant(baseStyle: number, attributes: Record<string, string>) {
    const styles = read("xl/styles.xml"), xfs = elements(styles, "cellXfs")[0];
    const clone = elements(xfs, "xf")[baseStyle].cloneNode(true) as import("@xmldom/xmldom").Element;
    for (const [key, value] of Object.entries(attributes)) clone.setAttribute(key, value);
    const index = elements(xfs, "xf").length;
    xfs.appendChild(clone); xfs.setAttribute("count", String(index + 1));
    files["xl/styles.xml"] = strToU8(serializeXml(styles));
    return String(index);
  }
  return {
    createSheet(name: string): TemplateSheet {
      return { name, sheet: read("xl/worksheets/sheet1.xml"), drawing: read("xl/drawings/drawing1.xml") };
    },
    strings: read("xl/sharedStrings.xml"),
    styleVariant,
    decimalStyle(baseStyle: number) {
      // The quotation template's existing $#,##0.00 format.
      return styleVariant(baseStyle, { numFmtId: "166" });
    },
    write(sheets: TemplateSheet[]) {
      const book = read("xl/workbook.xml"), rels = read("xl/_rels/workbook.xml.rels"), content = read("[Content_Types].xml");
      const sheetList = elements(book, "sheets")[0];
      while (sheetList.firstChild) sheetList.removeChild(sheetList.firstChild);
      let names = elements(book, "definedNames")[0];
      if (!names) {
        names = book.createElementNS(SHEET_NS, "definedNames");
        book.documentElement!.insertBefore(names, elements(book, "calcPr")[0] || null);
      }
      const relationships = elements(rels, "Relationship", REL_NS);
      const firstRel = relationships.find(r => r.getAttribute("Type")?.endsWith("/worksheet"))!;
      let nextId = Math.max(...relationships.map(r => Number(r.getAttribute("Id")?.replace("rId", "")) || 0)) + 1;
      sheets.forEach((entry, index) => {
        const n = index + 1, id = index === 0 ? firstRel.getAttribute("Id")! : `rId${nextId++}`;
        if (index) {
          const rel = rels.createElementNS(REL_NS, "Relationship");
          rel.setAttribute("Id", id); rel.setAttribute("Type", `${DOC_REL_NS}/worksheet`); rel.setAttribute("Target", `worksheets/sheet${n}.xml`);
          rels.documentElement!.appendChild(rel);
          for (const [part, type] of [[`/xl/worksheets/sheet${n}.xml`, "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"], [`/xl/drawings/drawing${n}.xml`, "application/vnd.openxmlformats-officedocument.drawing+xml"]]) {
            const override = content.createElementNS(CONTENT_NS, "Override");
            override.setAttribute("PartName", part); override.setAttribute("ContentType", type); content.documentElement!.appendChild(override);
          }
        }
        const sheet = book.createElementNS(SHEET_NS, "sheet");
        sheet.setAttribute("name", entry.name); sheet.setAttribute("sheetId", String(n)); sheet.setAttributeNS(DOC_REL_NS, "r:id", id);
        sheetList.appendChild(sheet);
        if (entry.printArea) {
          const area = book.createElementNS(SHEET_NS, "definedName");
          area.setAttribute("name", "_xlnm.Print_Area"); area.setAttribute("localSheetId", String(index));
          area.textContent = `'${entry.name}'!${entry.printArea}`; names.appendChild(area);
        }
        for (const view of elements(entry.sheet, "sheetView")) view.setAttribute("tabSelected", index ? "0" : "1");
        for (const setup of elements(entry.sheet, "pageSetup")) { setup.setAttribute("fitToWidth", "1"); setup.setAttribute("fitToHeight", "0"); }
        const sheetRels = read("xl/worksheets/_rels/sheet1.xml.rels");
        for (const rel of elements(sheetRels, "Relationship", REL_NS)) {
          if (rel.getAttribute("Type")?.endsWith("/drawing")) rel.setAttribute("Target", `../drawings/drawing${n}.xml`);
        }
        files[`xl/worksheets/sheet${n}.xml`] = strToU8(serializeXml(entry.sheet));
        files[`xl/worksheets/_rels/sheet${n}.xml.rels`] = strToU8(serializeXml(sheetRels));
        files[`xl/drawings/drawing${n}.xml`] = strToU8(serializeXml(entry.drawing));
        files[`xl/drawings/_rels/drawing${n}.xml.rels`] = files["xl/drawings/_rels/drawing1.xml.rels"];
      });
      files["xl/workbook.xml"] = strToU8(serializeXml(book));
      files["xl/_rels/workbook.xml.rels"] = strToU8(serializeXml(rels));
      files["[Content_Types].xml"] = strToU8(serializeXml(content));
      return zipSync(files, { level: 6 });
    },
  };
}
