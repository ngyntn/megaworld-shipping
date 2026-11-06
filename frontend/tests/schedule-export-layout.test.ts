import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";
import { buildSchedulesWorkbook } from "../src/features/excel-export/workbook/schedules.ts";
import { cell, DRAWING_NS, elements, parseXml } from "../src/features/excel-export/workbook/xml.ts";
import { templateDetails } from "../src/features/excel-export/types.ts";
import { recordId, schedules } from "./helpers/excel-fixtures.ts";

const template = readFileSync(new URL("../assets/excel/schedules.xlsx", import.meta.url));
const xml = (files: Record<string, Uint8Array>, name: string) => parseXml(strFromU8(files[name]));

test("schedule separates consecutive POL groups across POL/POD/carrier and removes spare table rows", () => {
  const rows = schedules(10).map((r, i) => {
    const group = i < 4 || (i >= 5 && i < 9) ? 1 : i === 4 ? 2 : 3;
    return { ...r, route: { ...r.route, id: recordId(100 + i),
      pol: { ...r.route.pol, id: recordId(group), code: `POL${group}` },
      pod: { ...r.route.pod, id: recordId(200 + i), code: `POD${i}` },
    } };
  });
  const files = unzipSync(buildSchedulesWorkbook(template, rows, templateDetails.schedules));
  const doc = xml(files, "xl/worksheets/sheet1.xml"), styles = xml(files, "xl/styles.xml");
  const xfs = elements(elements(styles, "cellXfs")[0], "xf"), borders = elements(elements(styles, "borders")[0], "border");
  const border = (ref: string, edge: string) => elements(borders[Number(xfs[Number(cell(doc, ref).getAttribute("s"))].getAttribute("borderId"))], edge)[0].getAttribute("style");
  for (const [first, last] of [[12, 15], [16, 16], [17, 20], [21, 21]]) {
    for (const col of ["B", "C", "D"]) {
      assert.equal(border(`${col}${first}`, "top"), "thin");
      assert.equal(border(`${col}${last}`, "bottom"), "thin");
    }
  }
  assert.equal(border("C13", "top"), null);
  assert.equal(border("C13", "bottom"), null);
  const merges = elements(doc, "mergeCell").map(m => m.getAttribute("ref"));
  assert.ok(merges.includes("B12:B15"));
  assert.ok(merges.includes("B17:B20"));
  assert.ok(merges.includes("B22:I22")); // The footer separator immediately follows the final data row.
  const footerIndex = Number(cell(doc, "B23").textContent);
  assert.match(elements(xml(files, "xl/sharedStrings.xml"), "si")[footerIndex].textContent || "", /Yours sincerely/);
  assert.equal(elements(doc, "c").filter(c => c.getAttribute("r")?.startsWith("I") && c.textContent?.includes("VESSEL")).length, 10);
  const before = elements(xml(unzipSync(template), "xl/drawings/drawing1.xml"), "row", DRAWING_NS).map(r => Number(r.textContent));
  const after = elements(xml(files, "xl/drawings/drawing1.xml"), "row", DRAWING_NS).map(r => Number(r.textContent));
  assert.deepEqual(after, before.map(r => r >= 27 ? r - 6 : r));
});

test("schedule TO/PIC labels remain black and custom recipient values retain the template red rich text", () => {
  const files = unzipSync(buildSchedulesWorkbook(template, schedules(1), { ...templateDetails.schedules, client: "CUSTOMER & CO.", contact: "Ms. Test" }));
  const doc = xml(files, "xl/worksheets/sheet1.xml");
  for (const [ref, label, recipient] of [["B9", "TO: ", "CUSTOMER & CO."], ["F9", "PIC:", " Ms. Test"]]) {
    const runs = elements(cell(doc, ref), "r");
    assert.equal(elements(runs[0], "t")[0].textContent, label);
    assert.equal(elements(runs[0], "color")[0].getAttribute("theme"), "1");
    assert.equal(elements(runs[1], "t")[0].textContent, recipient);
    assert.equal(elements(runs[1], "color")[0].getAttribute("rgb"), "FFFF0000");
  }
  assert.ok(elements(doc, "mergeCell").some(m => m.getAttribute("ref") === "B13:I13"));
  const styles = xml(files, "xl/styles.xml");
  const xf = elements(elements(styles, "cellXfs")[0], "xf")[Number(cell(doc, "B12").getAttribute("s"))];
  const border = elements(elements(styles, "borders")[0], "border")[Number(xf.getAttribute("borderId"))];
  assert.equal(elements(border, "top")[0].getAttribute("style"), "thin");
  assert.equal(elements(border, "bottom")[0].getAttribute("style"), "thin");
});
