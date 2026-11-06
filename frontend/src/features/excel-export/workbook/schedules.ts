import type { Schedule } from "../../operations/types";
import { templateDetails, type ExportDetails } from "../types.ts";
import { templatePackage } from "./package.ts";
import { fillTable, mergeGroups, setCellStyle } from "./table.ts";
import { replaceRichText } from "./xml.ts";

export const exportDate = (date: string) => date.slice(0, 10).split("-").reverse().join("/");

export function buildSchedulesWorkbook(template: Uint8Array, rows: Schedule[], details: ExportDetails) {
  const pkg = templatePackage(template), entry = pkg.createSheet("SCHEDULE"), doc = entry.sheet;
  const palettes = [12, 14, 17, 24];
  const carriers = [...new Set(rows.map(r => r.carrier.id))];
  const polStyle = pkg.styleVariant(58, { borderId: "12" });
  const groupStyles = [57, 56].map(base => ({
    top: pkg.styleVariant(base, { borderId: "16" }),
    bottom: pkg.styleVariant(base, { borderId: "17" }),
    both: pkg.styleVariant(base, { borderId: "12" }),
  }));
  const delta = fillTable(doc, entry.drawing, 12, 27, rows.map(r => ({
    templateRow: palettes[carriers.indexOf(r.carrier.id) % palettes.length],
    values: {
      B: r.route.pol.code, C: r.route.pod.code, D: r.carrier.code,
      E: exportDate(r.etd), F: exportDate(r.eta), G: `${r.transit_days} days`,
      H: [r.status === "cancelled" ? "Cancelled" : "", r.service_type === "direct" ? "Direct" : `Transit (${r.transshipment_port})`, r.public_note].filter(Boolean).join("\n"),
      I: [r.vessel_name, r.voyage].filter(Boolean).join(" / "),
    },
    height: Math.max(19.5, (r.public_note ? 3 : 1) * 14),
  })), { keepEmptyRows: false });
  // Close each contiguous POL group, including the POD/carrier cells beside it.
  // Keep POD rows inside the same POL group free of horizontal separators.
  rows.forEach((r, i) => {
    const first = i === 0 || rows[i - 1].route.pol.id !== r.route.pol.id;
    const last = i === rows.length - 1 || rows[i + 1].route.pol.id !== r.route.pol.id;
    setCellStyle(doc, `B${12 + i}`, polStyle);
    ["C", "D"].forEach((col, index) => {
      const edge = first && last ? "both" : first ? "top" : last ? "bottom" : undefined;
      setCellStyle(doc, `${col}${12 + i}`, edge ? groupStyles[index][edge] : index === 0 ? "57" : "56");
    });
  });
  mergeGroups(doc, rows, 12, "B", r => r.route.pol.id);
  mergeGroups(doc, rows, 12, "C", r => `${r.route.pol.id}:${r.route.pod.id}`);
  mergeGroups(doc, rows, 12, "D", r => `${r.route.id}:${r.carrier.id}`);
  replaceRichText(doc, pkg.strings, "B9", templateDetails.schedules.client, details.client);
  replaceRichText(doc, pkg.strings, "F9", templateDetails.schedules.contact, details.contact);
  entry.printArea = `$B$1:$I$${30 + delta}`;
  return pkg.write([entry]);
}
