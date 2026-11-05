const sec = require(__hooks + "/lib/security.js");
const rates = require(__hooks + "/lib/rates-save.js");
const schema = require(__hooks + "/lib/import-rows.js");
function preview(app, owner, body) {
  const rows = require(__hooks + "/lib/excel.js").read(body);
  const headers = schema.headers(rows[0].values);
  const payload = [], errors = [], items = [], seen = new Set();
  for (const row of rows.slice(1)) {
    try {
      const input = schema.normalize(app, owner, headers, row.values);
      const key = [input.route, input.carrier, input.lines[0].container_type].join("/");
      if (seen.has(key)) throw new BadRequestError("Duplicate route/carrier/container in this file.");
      const result = rates.preview(app, owner, input).items[0];
      seen.add(key); payload.push({ row: row.row, input });
      items.push({ row: row.row, action: input.lines[0].expected_revision ? "replace" : "new", cost_price_cents: input.lines[0].cost_price_cents,
        margin_cents: result.sell_price_cents - input.lines[0].cost_price_cents, ...result });
    } catch (error) { errors.push({ row: row.row, message: String(error.message || "Invalid row.").slice(0, 300) }); }
  }
  const job = new Record(app.findCollectionByNameOrId("import_jobs"));
  job.load({ owner, file_name: body.file_name, status: payload.length ? "validated" : "failed",
    total_rows: rows.length - 1, valid_rows: payload.length, imported_rows: 0, errors, payload, results: [] });
  app.save(job);
  return { id: job.id, status: job.getString("status"), total_rows: rows.length - 1, valid_rows: payload.length,
    new_rows: items.filter((row) => row.action === "new").length, replacement_rows: items.filter((row) => row.action === "replace").length, errors, items };
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
    if (rows.some((row) => !row.input)) throw new BadRequestError("Import has no validated rate rows.");
    const items = rows.map((row) => ({ row: row.row, ...rates.save(tx, owner, row.input).items[0] }));
    job.load({ status: "completed", imported_rows: rows.length, payload: null, results: items }); tx.save(job);
    result = { id, status: "completed", imported_rows: rows.length, items };
  });
  return result;
}
function template(event) {
  const v = require(__hooks + "/lib/validation.js");
  return require(__hooks + "/lib/excel.js").download(event, "rates-import-template.xlsx", [schema.HEADERS,
    ["ONE", "CAT_LAI", "USLAX", "40HC", "1900.50", "row", "150", v.today(), v.today(), "direct", "18", "", "", "", ""]]);
}
module.exports = { preview, commit, template };
