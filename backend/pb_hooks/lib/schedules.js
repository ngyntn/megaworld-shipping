const v = require(__hooks + "/lib/validation.js");
const sec = require(__hooks + "/lib/security.js");
const q = require(__hooks + "/lib/query.js");
function project(app, owner, record) {
  const route = sec.owned(app, "routes", record.getString("route"), owner);
  const carrier = sec.owned(app, "carriers", record.getString("carrier"), owner);
  const port = (id) => { const p = sec.owned(app, "ports", id, owner); return { id, code: p.getString("code"), name: p.getString("name") }; };
  const item = { id: record.id, revision: record.getInt("revision"),
    route: { id: route.id, pol: port(route.getString("pol")), pod: port(route.getString("pod")) },
    carrier: { id: carrier.id, code: carrier.getString("code"), name: carrier.getString("name") } };
  for (const name of ["vessel_name", "voyage", "etd", "eta", "service_type", "transshipment_port", "status", "public_note"]) item[name] = record.getString(name);
  item.transit_days = Math.round((Date.parse(item.eta) - Date.parse(item.etd)) / 86400000);
  item.departure_status = item.status === "cancelled" ? "cancelled" : item.etd < v.today() ? "departed" : "upcoming";
  return item;
}
function save(app, owner, body, id) {
  v.keys(body, ["route", "carrier", "vessel_name", "voyage", "etd", "eta", "service_type", "transshipment_port", "status", "public_note", "expected_revision"]);
  v.id(body.route, "route"); v.id(body.carrier, "carrier");
  if (!v.text(body.vessel_name, "vessel_name", 160).trim()) throw new BadRequestError("vessel_name is required.");
  v.day(body.etd, "etd"); v.day(body.eta, "eta");
  if (body.eta < body.etd) throw new BadRequestError("ETA must not precede ETD.");
  if (!["direct", "transit"].includes(body.service_type) || !["scheduled", "cancelled"].includes(body.status)) throw new BadRequestError("Invalid schedule status/service.");
  if (body.service_type === "transit" && !v.text(body.transshipment_port, "transshipment_port", 160).trim()) throw new BadRequestError("Transit port is required.");
  v.text(body.voyage, "voyage", 80); v.text(body.transshipment_port, "transshipment_port", 160); v.text(body.public_note, "public_note", 2000);
  if (!Number.isInteger(body.expected_revision) || body.expected_revision < 0) throw new BadRequestError("expected_revision is required.");
  let result;
  app.runInTransaction((tx) => {
    const route = sec.active(tx, "routes", body.route, owner);
    sec.active(tx, "ports", route.getString("pol"), owner); sec.active(tx, "ports", route.getString("pod"), owner);
    sec.active(tx, "carriers", body.carrier, owner);
    const record = id ? sec.owned(tx, "schedules", v.id(id, "schedule"), owner) : new Record(tx.findCollectionByNameOrId("schedules"));
    if (body.expected_revision !== record.getInt("revision")) throw new ApiError(409, "Schedule has changed; reload before saving.");
    for (const key of Object.keys(body)) if (key !== "expected_revision") record.set(key, body[key]);
    record.set("owner", owner); record.set("revision", body.expected_revision + 1);
    tx.save(record); result = project(tx, owner, record);
  });
  return result;
}
function list(app, owner, query, publicOnly, exportAll) {
  const options = q.paging(query, ["route", "carrier", "pol", "pod", "from", "to", "status"]);
  const params = { owner, limit: exportAll ? 5001 : options.size + 1, offset: exportAll ? 0 : options.offset };
  let filter = q.filters(query, "s", params);
  for (const key of ["from", "to"]) if (query[key]) {
    params[key] = v.day(query[key], key); filter += " AND s.etd " + (key === "from" ? ">=" : "<=") + " {:" + key + "}";
  }
  if (query.from && query.to && query.from > query.to) throw new BadRequestError("Invalid departure date range.");
  if (query.status && !["scheduled", "cancelled"].includes(query.status)) throw new BadRequestError("Invalid status.");
  if (publicOnly && query.status === "cancelled") throw new BadRequestError("Cancelled schedules are private.");
  if (publicOnly || query.status) { params.status = publicOnly ? "scheduled" : query.status; filter += " AND s.status = {:status}"; }
  const records = q.rows(app, "SELECT s.id FROM schedules s " + q.joins + " WHERE s.owner = {:owner}" + filter + " ORDER BY s.etd, s.id LIMIT {:limit} OFFSET {:offset}", params);
  if (exportAll && records.length > 5000) throw new BadRequestError("Narrow filters to export at most 5000 schedules.");
  const transform = (row) => project(app, owner, app.findRecordById("schedules", row.id));
  if (exportAll) return records.map(transform);
  const result = q.page(records, options, transform);
  if (!publicOnly) {
    const counts = q.rows(app, "SELECT COUNT(*) AS total FROM schedules s " + q.joins + " WHERE s.owner = {:owner}" + filter, params, { total: 0 });
    result.total = counts[0].total;
    result.pages = Math.max(1, Math.ceil(result.total / options.size));
  }
  return result;
}
module.exports = { save, list, project };
