const sec = require(__hooks + "/lib/security.js");
const schedules = require(__hooks + "/lib/schedules.js");
const schema = require(__hooks + "/lib/schedule-import-rows.js");
function routeFor(tx, owner, input, cache) {
  if (input.route) return input.route;
  const key = input.pol + "/" + input.pod;
  if (cache[key]) return cache[key];
  const found = tx.findRecordsByFilter("routes", "owner = {:owner} && pol = {:pol} && pod = {:pod}", "", 1, 0, { owner, pol: input.pol, pod: input.pod });
  let route = found.length ? found[0] : null;
  if (!route) {
    route = new Record(tx.findCollectionByNameOrId("routes"));
    route.set("owner", owner); route.set("pol", input.pol); route.set("pod", input.pod); route.set("active", true);
    tx.save(route);
  }
  return (cache[key] = route.id);
}
function preview(app, owner, body) {
  const rows = require(__hooks + "/lib/excel.js").read(body);
  if (!rows.length) throw new BadRequestError("Workbook is empty.");
  const headers = schema.headers(rows[0].values);
  const payload = [], errors = [], items = [], seen = new Set();
  for (const row of rows.slice(1)) {
    try {
      const parsed = schema.normalize(app, owner, headers, row.values);
      const input = parsed.input;
      const key = [input.pol, input.pod, input.carrier, input.vessel_name, input.voyage, input.etd].join("/");
      if (seen.has(key)) throw new BadRequestError("Duplicate schedule in this file.");
      seen.add(key); payload.push({ row: row.row, id: parsed.id, schedule: input });
      items.push({ row: row.row, action: parsed.id ? "update" : "new", ...parsed.item });
    } catch (error) { errors.push({ row: row.row, message: String(error.message || "Invalid row.").slice(0, 300) }); }
  }
  const job = new Record(app.findCollectionByNameOrId("import_jobs"));
  job.load({ owner, file_name: body.file_name, status: payload.length ? "validated" : "failed",
    total_rows: rows.length - 1, valid_rows: payload.length, imported_rows: 0, errors, payload, results: [] });
  app.save(job);
  return { id: job.id, status: job.getString("status"), total_rows: rows.length - 1, valid_rows: payload.length,
    new_rows: items.filter((row) => row.action === "new").length, update_rows: items.filter((row) => row.action === "update").length, errors, items };
}
function commit(app, owner, id, body) {
  const v = require(__hooks + "/lib/validation.js");
  v.keys(body, []); v.id(id, "job");
  let result;
  app.runInTransaction((tx) => {
    const job = sec.owned(tx, "import_jobs", id, owner);
    if (job.getString("status") === "completed") {
      result = { id, status: "completed", imported_rows: job.getInt("imported_rows"), items: JSON.parse(job.getString("results")) || [] }; return;
    }
    if (job.getString("status") !== "validated") throw new BadRequestError("Import has no validated rows.");
    if (Date.now() - Date.parse(job.getString("created")) > 86400000) throw new ApiError(409, "Preview expired; upload and preview again.");
    const rows = JSON.parse(job.getString("payload"));
    if (rows.some((row) => !row.schedule)) throw new BadRequestError("Import has no validated schedule rows.");
    const cache = {};
    const items = rows.map((row) => {
      const input = row.schedule;
      const save = { route: routeFor(tx, owner, input, cache), carrier: input.carrier, vessel_name: input.vessel_name, voyage: input.voyage,
        etd: input.etd, eta: input.eta, service_type: input.service_type, transshipment_port: input.transshipment_port,
        status: input.status, public_note: input.public_note, expected_revision: input.expected_revision };
      return { row: row.row, id: schedules.save(tx, owner, save, row.id || undefined).id };
    });
    job.load({ status: "completed", imported_rows: rows.length, payload: null, results: items }); tx.save(job);
    result = { id, status: "completed", imported_rows: rows.length, items };
  });
  return result;
}
function template(event) {
  const v = require(__hooks + "/lib/validation.js");
  const start = new Date(v.today() + "T00:00:00Z"), end = new Date(start.getTime() + 18 * 86400000);
  return require(__hooks + "/lib/excel.js").download(event, "schedules-import-template.xlsx", [schema.HEADERS,
    ["ONE", "CAT_LAI", "USLAX", "ONE MAJESTY", "123E", start.toISOString().slice(0, 10), end.toISOString().slice(0, 10), "direct", "", ""]]);
}
module.exports = { preview, commit, template };
