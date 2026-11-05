/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const relation = (name, collection) => ({ name, type: "relation", required: true,
    collectionId: app.findCollectionByNameOrId(collection).id, maxSelect: 1, cascadeDelete: false });
  const money = (name) => ({ name, type: "number", min: 0, max: 1000000000, onlyInt: true });
  const select = (name, values) => ({ name, type: "select", required: true, maxSelect: 1, values });
  const create = (name, fields, indexes) => app.save(new Collection({
    name, type: "base",
    listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [relation("owner", "staff"), ...fields,
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true }], indexes,
  }));
  create("route_margins", [relation("route", "routes"), money("margin_cents")],
    ["CREATE UNIQUE INDEX idx_route_margin ON route_margins (owner, route)"]);
  create("rate_series", [relation("route", "routes"), relation("carrier", "carriers"),
    select("container_type", ["20GP", "40GP", "40HC"]), { name: "active", type: "bool" }],
    ["CREATE UNIQUE INDEX idx_rate_series_key ON rate_series (owner, route, carrier, container_type)"]);
  create("rate_versions", [relation("series", "rate_series"),
    { name: "revision", type: "number", required: true, min: 1, max: 2147483647, onlyInt: true },
    { name: "is_current", type: "bool" },
    { name: "valid_from", type: "text", required: true, pattern: "^\\d{4}-\\d{2}-\\d{2}$", max: 10 },
    { name: "valid_to", type: "text", required: true, pattern: "^\\d{4}-\\d{2}-\\d{2}$", max: 10 },
    money("sell_price_cents"),
    { name: "local_charges", type: "text", max: 2000 },
    { name: "surcharges", type: "text", max: 2000 },
    { name: "trade_term", type: "text", max: 20 },
    { name: "cargo_type", type: "text", max: 40 },
    { name: "transit_days", type: "number", min: 0, max: 365, onlyInt: true },
    select("service_type", ["direct", "transit"]),
    { name: "public_note", type: "text", max: 4000 }],
    ["CREATE UNIQUE INDEX idx_rate_revision ON rate_versions (series, revision)",
      "CREATE UNIQUE INDEX idx_rate_current ON rate_versions (series) WHERE is_current = 1",
      "CREATE INDEX idx_rate_owner_validity ON rate_versions (owner, is_current, valid_to, valid_from)"]);
  create("rate_costs", [relation("rate_version", "rate_versions"),
    money("cost_price_cents"), money("margin_cents"), select("margin_source", ["default", "route", "row"]),
    { name: "internal_note", type: "text", max: 8000 }],
    ["CREATE UNIQUE INDEX idx_rate_cost_version ON rate_costs (rate_version)",
      "CREATE INDEX idx_rate_cost_owner ON rate_costs (owner)"]);
}, (app) => {
  for (const name of ["rate_costs", "rate_versions", "rate_series", "route_margins"]) {
    app.delete(app.findCollectionByNameOrId(name));
  }
});
