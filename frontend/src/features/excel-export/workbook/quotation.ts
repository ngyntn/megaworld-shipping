import type { RateRecord } from "../../rates/types";
import type { ExportDetails } from "../types";
import { templatePackage } from "./package.ts";
import { fillTable, mergeGroups, setCellStyle } from "./table.ts";
import { merge, replaceRichText, setValue } from "./xml.ts";
import { exportDate } from "./schedules.ts";

const containerLabel = (value: string) => value.replace(/^(\d{2})/, "$1'");
const unique = (values: string[]) => [...new Set(values.filter(Boolean))].join(" / ");

/** One original-layout sheet per container type; quoted amounts are selling prices only. */
export function buildQuotationWorkbook(template: Uint8Array, rows: RateRecord[], details: ExportDetails, today: string) {
  const pkg = templatePackage(template);
  const types = [...new Set(rows.map(r => r.container_type))].sort();
  const decimalStyle = rows.some(r => r.sell_price_cents % 100) ? pkg.decimalStyle(32) : undefined;
  // Template styles 29/30 omit the bottom edge because their cells were merged.
  // Preserve their fonts/alignment and use the template's complete thin border.
  const portStyle = pkg.styleVariant(29, { borderId: "7" });
  const quantityStyle = pkg.styleVariant(30, { borderId: "7" });
  const sheets = types.map(type => {
    const lines = rows.filter(r => r.container_type === type), entry = pkg.createSheet(type), doc = entry.sheet;
    const delta = fillTable(doc, entry.drawing, 26, 34, lines.map((r, i) => {
      const remark = [`Valid ${exportDate(r.valid_from)} - ${exportDate(r.valid_to)}`, r.service_type === "transit" ? "Transit svc" : "", r.public_note, r.surcharges, r.local_charges].filter(Boolean).join("\n");
      return { templateRow: 26, values: { A: i + 1, B: r.polCode, C: r.podCode, D: details.quantity, E: r.carrierCode, F: r.sell_price_cents / 100, H: remark }, height: Math.max(33.75, remark.split("\n").reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 47)), 0) * 14) };
    }));
    lines.forEach((r, i) => { if (decimalStyle && r.sell_price_cents % 100) setCellStyle(doc, `F${26 + i}`, decimalStyle); });
    for (let i = 0; i < Math.max(9, lines.length); i++) {
      merge(doc, `F${26 + i}:G${26 + i}`);
      setCellStyle(doc, `B${26 + i}`, portStyle);
      setCellStyle(doc, `C${26 + i}`, portStyle);
      setCellStyle(doc, `D${26 + i}`, quantityStyle);
    }
    mergeGroups(doc, lines, 26, "B", r => r.polCode);
    mergeGroups(doc, lines, 26, "C", r => `${r.polCode}:${r.podCode}`);
    mergeGroups(doc, lines, 26, "D", r => `${r.polCode}:${r.podCode}`);
    const date = new Date(`${today}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase();
    setValue(doc, "A11", `Date: ${date}`);
    setValue(doc, "B13", details.client); setValue(doc, "B14", details.contact);
    setValue(doc, "B15", details.address); setValue(doc, "B16", details.sales);
    const routes = [...new Set(lines.map(r => `${r.polCode} - ${r.podCode}`))];
    setValue(doc, "H13", routes.length > 3 ? `${routes.length} routes (see below)` : routes.join(" / "));
    setValue(doc, "H14", unique(lines.map(r => r.cargo_type)));
    setValue(doc, "H15", containerLabel(type)); setValue(doc, "H16", unique(lines.map(r => r.trade_term)));
    setValue(doc, "F25", containerLabel(type)); setValue(doc, `F${39 + delta}`, containerLabel(type));
    replaceRichText(doc, pkg.strings, "A17", "Ms. Trúc", details.contact || "Customer");
    // Keep the original remarks formatting, replacing only the sample's obsolete validity.
    const dates = lines.map(r => r.valid_to).sort();
    replaceRichText(doc, pkg.strings, `A${47 + delta}`, "end Oct 2026", exportDate(dates[0]));
    entry.printArea = `$A$1:$H$${60 + delta}`;
    return entry;
  });
  return pkg.write(sheets);
}
