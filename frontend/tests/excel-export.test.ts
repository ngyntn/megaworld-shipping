import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";
import { buildSchedulesWorkbook } from "../src/features/excel-export/workbook/schedules.ts";
import { buildQuotationWorkbook } from "../src/features/excel-export/workbook/quotation.ts";
import { cell, DRAWING_NS, elements, parseXml } from "../src/features/excel-export/workbook/xml.ts";
import { exportRows } from "../src/features/excel-export/selection.ts";
import { parseExportRequest } from "../src/features/excel-export/schemas/export-request.ts";
import { templateDetails } from "../src/features/excel-export/types.ts";
import { recordId, rates, schedules } from "./helpers/excel-fixtures.ts";

const scheduleTemplate = readFileSync(new URL("../assets/excel/schedules.xlsx", import.meta.url));
const quoteTemplate = readFileSync(new URL("../assets/excel/quotation.xlsx", import.meta.url));
const xml = (files: Record<string, Uint8Array>, path = "xl/worksheets/sheet1.xml") => parseXml(strFromU8(files[path]));
const value = (files: Record<string, Uint8Array>, ref: string, path?: string) => {
  const c = cell(xml(files, path), ref);
  if (c.getAttribute("t") === "s") return elements(xml(files, "xl/sharedStrings.xml"), "si")[Number(c.textContent)].textContent;
  return c.textContent;
};
function unchangedAssets(template: Uint8Array, file: Record<string, Uint8Array>) {
  for (const [name, bytes] of Object.entries(unzipSync(template))) {
    if (/^xl\/(media\/|theme\/|sharedStrings|drawings\/_rels\/)/.test(name)) assert.deepEqual(file[name], bytes, name);
  }
}

test("schedule export preserves template images, styles, header, footer and clears all sample voyages", () => {
  const files = unzipSync(buildSchedulesWorkbook(scheduleTemplate, schedules(3), templateDetails.schedules));
  unchangedAssets(scheduleTemplate, files);
  const originalStyles = elements(elements(xml(unzipSync(scheduleTemplate), "xl/styles.xml"), "cellXfs")[0], "xf");
  const styles = elements(elements(xml(files, "xl/styles.xml"), "cellXfs")[0], "xf");
  assert.deepEqual(styles.slice(0, originalStyles.length).map(s => s.toString()), originalStyles.map(s => s.toString()));
  assert.equal(value(files, "I12"), "VESSEL 1 / VOY-1");
  assert.equal(value(files, "B12"), "VNSGN");
  assert.equal(value(files, "C12"), "USLGB");
  assert.equal(value(files, "E12"), "10/11/2026");
  assert.equal(value(files, "I15"), "");
  assert.equal(value(files, "B9"), `TO: ${templateDetails.schedules.client}`);
  assert.match(value(files, "B16")!, /Yours sincerely/);
  const doc = xml(files);
  assert.ok(elements(doc, "mergeCell").some(m => m.getAttribute("ref") === "B12:B14"));
  assert.deepEqual(elements(xml(unzipSync(scheduleTemplate)), "cols")[0].toString(), elements(doc, "cols")[0].toString());
});

test("schedule data grows beyond the template and moves every footer drawing without changing geometry", () => {
  const original = unzipSync(scheduleTemplate);
  const files = unzipSync(buildSchedulesWorkbook(scheduleTemplate, schedules(41), templateDetails.schedules));
  unchangedAssets(scheduleTemplate, files);
  assert.equal(value(files, "I52"), "VESSEL 41 / VOY-41");
  assert.match(value(files, "B54")!, /Sophia Thuong/); // Original row 29 + 25 added rows.
  const drawingPath = "xl/drawings/drawing1.xml";
  const before = elements(xml(original, drawingPath), "row", DRAWING_NS).map(n => Number(n.textContent));
  const after = elements(xml(files, drawingPath), "row", DRAWING_NS).map(n => Number(n.textContent));
  assert.deepEqual(after, before.map(n => n >= 27 ? n + 25 : n));
});

test("quotation exports every container type with exact selling cents and the original branded assets", () => {
  const input = rates(36);
  const files = unzipSync(buildQuotationWorkbook(quoteTemplate, input, { ...templateDetails.rates, client: '=HYPERLINK("example")', contact: "Mr. Test & Co." }, "2026-11-06"));
  unchangedAssets(quoteTemplate, files);
  assert.deepEqual(elements(xml(files, "xl/workbook.xml"), "sheet").map(s => s.getAttribute("name")), ["20GP", "40GP", "40HC"]);
  for (let sheet = 1; sheet <= 3; sheet++) {
    const path = `xl/worksheets/sheet${sheet}.xml`, doc = xml(files, path);
    assert.equal(value(files, "F26", path), "2225.75");
    assert.equal(value(files, "B26", path), "VNSGN");
    assert.equal(value(files, "C26", path), "INMUN");
    assert.equal(value(files, "H13", path), "VNSGN - INMUN");
    assert.equal(cell(doc, "F26").getAttribute("t"), null);
    const style = elements(elements(xml(files, "xl/styles.xml"), "cellXfs")[0], "xf")[Number(cell(doc, "F26").getAttribute("s"))];
    assert.equal(style.getAttribute("numFmtId"), "166");
    assert.equal(value(files, "A37", path), "12");
    assert.equal(value(files, "I26", path), "");
    assert.equal(value(files, "F43", path), "220.0"); // Local-charge table moves down 3 rows.
    assert.equal(cell(doc, "B13").getAttribute("t"), "inlineStr");
    assert.equal(elements(cell(doc, "B13"), "f").length, 0);
    assert.equal(elements(doc, "f")[0].textContent, "SUM(F43:G46)");
    assert.match(value(files, "A17", path)!, /Dear Mr\. Test & Co\./);
    assert.equal(value(files, "F25", path), ["20'GP", "40'GP", "40'HC"][sheet - 1]);
    assert.ok(elements(doc, "row").filter(row => Number(row.getAttribute("r")) >= 26 && Number(row.getAttribute("r")) <= 37).every(row => row.getAttribute("hidden") !== "1"));
    assert.doesNotMatch(strFromU8(files[path]), /SECRET INTERNAL NOTE|199999|22576/);
    const rels = strFromU8(files[`xl/worksheets/_rels/sheet${sheet}.xml.rels`]);
    assert.match(rels, new RegExp(`drawing${sheet}\\.xml`));
  }
});

test("integer quotation prices retain original style definitions and unused sample rows become empty", () => {
  const rows = rates(1).map(r => ({ ...r, sell_price_cents: 222500 }));
  const files = unzipSync(buildQuotationWorkbook(quoteTemplate, rows, templateDetails.rates, "2026-11-06"));
  const original = xml(unzipSync(quoteTemplate), "xl/styles.xml"), updated = xml(files, "xl/styles.xml");
  const originalStyles = elements(elements(original, "cellXfs")[0], "xf");
  assert.deepEqual(elements(elements(updated, "cellXfs")[0], "xf").slice(0, originalStyles.length).map(s => s.toString()), originalStyles.map(s => s.toString()));
  assert.equal(value(files, "F27"), "");
  assert.equal(value(files, "H28"), "");
  assert.equal(value(files, "F40"), "220.0");
  assert.match(value(files, "A47")!, /30\/11\/2026/);
});

test("quotation POL/POD/Quantity borders close merged groups, single rows and the table bottom", () => {
  for (const count of [1, 12]) {
    const rows = rates(count).map((r, i) => ({ ...r, container_type: "40HC" as const, polCode: i < 5 ? "VNSGN" : "VNHPH", podCode: i < 5 ? "INMUN" : "AEJEA" }));
    const files = unzipSync(buildQuotationWorkbook(quoteTemplate, rows, templateDetails.rates, "2026-11-06"));
    const doc = xml(files), styles = xml(files, "xl/styles.xml");
    const xfs = elements(elements(styles, "cellXfs")[0], "xf"), borders = elements(elements(styles, "borders")[0], "border");
    const bottom = 26 + Math.max(9, count) - 1;
    for (const row of new Set([26, 26 + count - 1, bottom, ...(count > 5 ? [30, 31] : [])])) {
      for (const col of ["B", "C", "D"]) {
        const xf = xfs[Number(cell(doc, `${col}${row}`).getAttribute("s"))];
        const border = borders[Number(xf.getAttribute("borderId"))];
        for (const edge of ["left", "right", "top", "bottom"]) assert.equal(elements(border, edge)[0]?.getAttribute("style"), "thin", `${col}${row} ${edge}`);
      }
    }
    if (count > 5) {
      const merges = elements(doc, "mergeCell").map(m => m.getAttribute("ref"));
      for (const col of ["B", "C", "D"]) {
        assert.ok(merges.includes(`${col}26:${col}30`));
        assert.ok(merges.includes(`${col}31:${col}37`));
      }
    }
  }
});

test("filtered exports use every matching row; checkbox exports keep every container in selected groups", () => {
  const groups = Array.from({ length: 151 }, (_, i) => [{ id: recordId(i * 2 + 1) }, { id: recordId(i * 2 + 2) }]);
  assert.equal(exportRows(groups, { scope: "filtered", ids: [] }).length, 151);
  assert.deepEqual(exportRows(groups, { scope: "selected", ids: [recordId(301)] }), [groups[150]]);
  assert.throws(() => exportRows(groups, { scope: "selected", ids: [recordId(999)] }), /không còn khớp bộ lọc/);
});

test("export request drops pagination and rejects invalid selection, scopes and unsafe XML text", () => {
  const input = { scope: "filtered", ids: [], filters: { page: "9", per_page: "1", pol: recordId(801), tab: "history", q: "MUNDRA", month: "2026-11" }, details: templateDetails.rates };
  const parsed = parseExportRequest(input, "rates");
  assert.deepEqual(parsed.filters, { pol: recordId(801), tab: "history", q: "MUNDRA", month: "2026-11" });
  assert.throws(() => parseExportRequest({ ...input, scope: "selected" }, "rates"), /ít nhất/);
  assert.throws(() => parseExportRequest({ ...input, ids: ["not-an-id"] }, "rates"), /không hợp lệ/);
  assert.throws(() => parseExportRequest({ ...input, filters: { month: "2026-13" } }, "rates"), /Tháng/);
  assert.throws(() => parseExportRequest({ ...input, details: { ...input.details, client: "bad\u0001" } }, "rates"), /không hợp lệ/);
});
