/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const relation = (name, collection) => ({ name, type: "relation", required: true,
    collectionId: app.findCollectionByNameOrId(collection).id, maxSelect: 1, cascadeDelete: false });
  const day = (name) => ({ name, type: "text", required: true,
    pattern: "^\\d{4}-\\d{2}-\\d{2}$", max: 10 });
  const create = (name, fields, indexes) => app.save(new Collection({
    name, type: "base",
    listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [relation("owner", "staff"), ...fields,
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true }], indexes,
  }));
  create("schedules", [relation("route", "routes"), relation("carrier", "carriers"),
    { name: "vessel_name", type: "text", required: true, max: 160 },
    { name: "voyage", type: "text", max: 80 }, day("etd"), day("eta"),
    { name: "service_type", type: "select", required: true, maxSelect: 1, values: ["direct", "transit"] },
    { name: "transshipment_port", type: "text", max: 160 },
    { name: "status", type: "select", required: true, maxSelect: 1, values: ["scheduled", "cancelled"] },
    { name: "public_note", type: "text", max: 2000 }],
    ["CREATE INDEX idx_schedule_lookup ON schedules (owner, route, etd, carrier)"]);
  create("rate_schedules", [relation("rate_version", "rate_versions"),
    relation("schedule", "schedules"),
    { name: "snapshot", type: "json", required: true, maxSize: 20000 }],
    ["CREATE UNIQUE INDEX idx_rate_schedule ON rate_schedules (rate_version, schedule)",
      "CREATE INDEX idx_rate_schedule_owner ON rate_schedules (owner)"]);
  create("search_daily_stats", [relation("route", "routes"), day("day"),
    { name: "search_count", type: "number", min: 0, max: 9007199254740991, onlyInt: true }],
    ["CREATE UNIQUE INDEX idx_search_daily ON search_daily_stats (owner, route, day)",
      "CREATE INDEX idx_search_day ON search_daily_stats (owner, day)"]);
  create("import_jobs", [
    { name: "file_name", type: "text", required: true, max: 255 },
    { name: "status", type: "select", required: true, maxSelect: 1,
      values: ["pending", "validated", "completed", "failed"] },
    { name: "total_rows", type: "number", min: 0, onlyInt: true },
    { name: "imported_rows", type: "number", min: 0, onlyInt: true },
    { name: "errors", type: "json", maxSize: 2000000 }],
    ["CREATE INDEX idx_import_owner ON import_jobs (owner, created)"]);
}, (app) => {
  for (const name of ["import_jobs", "search_daily_stats", "rate_schedules", "schedules"]) {
    app.delete(app.findCollectionByNameOrId(name));
  }
});
