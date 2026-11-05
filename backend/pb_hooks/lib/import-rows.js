const v = require(__hooks + "/lib/validation.js");
const HEADERS = ["carrier_code", "pol_code", "pod_code", "container_type", "cost_price_usd", "margin_mode", "margin_usd", "valid_from", "valid_to", "service_type", "transit_days", "local_charges", "surcharges", "public_note", "internal_note"];
function money(value, name) {
  if (typeof value !== "string" || !/^\d+(\.\d{1,2})?$/.test(value)) throw new BadRequestError(name + " requires a nonnegative USD amount with at most 2 decimals.");
  const parts = value.split(".");
  return v.cents(Number(parts[0]) * 100 + Number(((parts[1] || "") + "00").slice(0, 2)), name);
}
function lookup(app, owner, collection, code) {
  const records = app.findRecordsByFilter(collection, "owner = {:owner} && code = {:code} && active = true", "", 1, 0, { owner, code });
  if (!records.length) throw new BadRequestError("Unknown or inactive " + collection + " code.");
  return records[0].id;
}
function normalize(app, owner, headers, values) {
  if (values.length > headers.length) throw new BadRequestError("Row has more cells than headers.");
  const row = {}; headers.forEach((key, index) => { row[key] = values[index] || ""; });
  const carrier = lookup(app, owner, "carriers", row.carrier_code);
  const pol = lookup(app, owner, "ports", row.pol_code), pod = lookup(app, owner, "ports", row.pod_code);
  const routes = app.findRecordsByFilter("routes", "owner = {:owner} && pol = {:pol} && pod = {:pod} && active = true", "", 1, 0, { owner, pol, pod });
  if (!routes.length) throw new BadRequestError("Create the export route before importing.");
  const route = routes[0].id;
  const series = app.findRecordsByFilter("rate_series", "owner = {:owner} && route = {:route} && carrier = {:carrier} && container_type = {:container}", "", 1, 0, { owner, route, carrier, container: row.container_type });
  const current = series.length ? app.findRecordsByFilter("rate_versions", "series = {:series} && owner = {:owner} && is_current = true", "", 1, 0, { owner, series: series[0].id }) : [];
  const line = { container_type: row.container_type, cost_price_cents: money(row.cost_price_usd, "cost_price_usd"), margin_mode: row.margin_mode,
    expected_revision: current.length ? current[0].getInt("revision") : 0 };
  if (row.margin_mode === "row") line.margin_cents = money(row.margin_usd, "margin_usd");
  else if (row.margin_usd) throw new BadRequestError("Leave margin_usd empty in default/route mode.");
  if (!/^\d+$/.test(row.transit_days)) throw new BadRequestError("transit_days must be an integer.");
  return { route, carrier, valid_from: row.valid_from, valid_to: row.valid_to, service_type: row.service_type,
    transit_days: Number(row.transit_days), local_charges: row.local_charges, surcharges: row.surcharges,
    public_note: row.public_note, internal_note: row.internal_note, schedule_ids: [], lines: [line] };
}
function headers(values) {
  const required = HEADERS.slice(0, 11).filter((key) => key !== "margin_usd");
  if (new Set(values).size !== values.length || values.some((key) => !HEADERS.includes(key)) || required.some((key) => !values.includes(key))) throw new BadRequestError("Invalid workbook headers; use the import template.");
  return values;
}
module.exports = { HEADERS, normalize, headers };
