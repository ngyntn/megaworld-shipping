/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const relation = (name, collection) => ({ name, type: "relation", required: true,
    collectionId: app.findCollectionByNameOrId(collection).id, maxSelect: 1, cascadeDelete: false });
  const text = (name, max, required = false) => ({ name, type: "text", max, required });
  const create = (name, fields, indexes) => app.save(new Collection({
    name, type: "base",
    listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [relation("owner", "staff"), ...fields,
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true }], indexes,
  }));
  create("carriers", [text("code", 20, true), text("name", 160, true),
    text("name_en", 160), text("name_zh", 160), { name: "active", type: "bool" },
    { name: "logo", type: "file", maxSelect: 1, maxSize: 2097152,
      mimeTypes: ["image/png", "image/jpeg", "image/webp"] }],
  ["CREATE UNIQUE INDEX idx_carrier_owner_code ON carriers (owner, code)"]);
  create("ports", [text("code", 20, true), text("unlocode", 5),
    text("name", 160, true), text("name_en", 160), text("name_zh", 160),
    text("country_code", 2, true), text("region", 80),
    { name: "can_be_pol", type: "bool" }, { name: "can_be_pod", type: "bool" },
    { name: "active", type: "bool" }],
  ["CREATE UNIQUE INDEX idx_port_owner_code ON ports (owner, code)",
    "CREATE INDEX idx_port_owner_region ON ports (owner, region)"]);
  create("routes", [relation("pol", "ports"), relation("pod", "ports"),
    { name: "active", type: "bool" }],
  ["CREATE UNIQUE INDEX idx_route_owner_ports ON routes (owner, pol, pod)"]);
}, (app) => {
  for (const name of ["routes", "ports", "carriers"]) {
    app.delete(app.findCollectionByNameOrId(name));
  }
});
