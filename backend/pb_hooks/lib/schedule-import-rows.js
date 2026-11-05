const v = require(__hooks + "/lib/validation.js");
const HEADERS = ["carrier_code", "pol_code", "pod_code", "vessel_name", "voyage", "etd", "eta", "service_type", "transshipment_port", "public_note"];
const REQUIRED = ["carrier_code", "pol_code", "pod_code", "vessel_name", "etd", "eta", "service_type"];
function lookup(app, owner, collection, code) {
  const records = app.findRecordsByFilter(collection, "owner = {:owner} && code = {:code} && active = true", "", 1, 0, { owner, code });
  if (!records.length) throw new BadRequestError("Unknown or inactive " + collection + " code.");
  return records[0];
}
function headers(values) {
  if (new Set(values).size !== values.length || values.some((key) => !HEADERS.includes(key)) || REQUIRED.some((key) => !values.includes(key))) throw new BadRequestError("Invalid workbook headers; use the import template.");
  return values;
}
function findRoute(app, owner, pol, pod) {
  const routes = app.findRecordsByFilter("routes", "owner = {:owner} && pol = {:pol} && pod = {:pod}", "", 1, 0, { owner, pol, pod });
  if (routes.length && !routes[0].getBool("active")) throw new BadRequestError("Route is inactive.");
  return routes.length ? routes[0].id : "";
}
function normalize(app, owner, headerKeys, values) {
  if (values.length > headerKeys.length) throw new BadRequestError("Row has more cells than headers.");
  const row = {}; headerKeys.forEach((key, index) => { row[key] = String(values[index] || "").trim(); });
  const carrier = lookup(app, owner, "carriers", row.carrier_code);
  const pol = lookup(app, owner, "ports", row.pol_code), pod = lookup(app, owner, "ports", row.pod_code);
  if (pol.id === pod.id || !pol.getBool("can_be_pol") || pol.getString("country_code") !== "VN" || !pod.getBool("can_be_pod")) throw new BadRequestError("Invalid export route origin/destination.");
  if (!row.vessel_name) throw new BadRequestError("vessel_name is required.");
  v.text(row.vessel_name, "vessel_name", 160); v.text(row.voyage, "voyage", 80);
  v.text(row.transshipment_port, "transshipment_port", 160); v.text(row.public_note, "public_note", 2000);
  v.day(row.etd, "etd"); v.day(row.eta, "eta");
  if (row.eta < row.etd) throw new BadRequestError("ETA must not precede ETD.");
  const service = row.service_type.toLowerCase();
  if (!["direct", "transit"].includes(service)) throw new BadRequestError("service_type must be direct or transit.");
  if (service === "transit" && !row.transshipment_port) throw new BadRequestError("transshipment_port is required for transit service.");
  if (service === "direct" && row.transshipment_port) throw new BadRequestError("Leave transshipment_port empty for direct service.");
  const route = findRoute(app, owner, pol.id, pod.id);
  const existing = route ? app.findRecordsByFilter("schedules", "owner = {:owner} && route = {:route} && carrier = {:carrier} && vessel_name = {:vessel} && voyage = {:voyage} && etd = {:etd}", "", 1, 0,
    { owner, route, carrier: carrier.id, vessel: row.vessel_name, voyage: row.voyage, etd: row.etd }) : [];
  const found = existing.length ? existing[0] : null;
  return {
    input: { route, pol: pol.id, pod: pod.id, carrier: carrier.id, vessel_name: row.vessel_name, voyage: row.voyage, etd: row.etd, eta: row.eta,
      service_type: service, transshipment_port: row.transshipment_port, public_note: row.public_note,
      status: found ? found.getString("status") : "scheduled", expected_revision: found ? found.getInt("revision") : 0 },
    id: found ? found.id : "",
    item: { carrier: carrier.getString("code"), route: pol.getString("name") + " → " + pod.getString("name"), vessel_name: row.vessel_name, voyage: row.voyage,
      etd: row.etd, eta: row.eta, transit_days: Math.round((Date.parse(row.eta) - Date.parse(row.etd)) / 86400000), service_type: service },
  };
}
module.exports = { HEADERS, headers, normalize };
