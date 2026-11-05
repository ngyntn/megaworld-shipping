/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const timestamps = () => [
    { name: "created", type: "autodate", onCreate: true },
    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
  ];
  const staff = new Collection({
    name: "staff", type: "auth",
    listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    manageRule: null, authRule: "active = true",
    passwordAuth: { enabled: true, identityFields: ["email"] },
    fields: [
      { name: "name", type: "text", required: true, max: 120 },
      { name: "job_title", type: "text", max: 120 },
      { name: "phone", type: "text", max: 40 },
      { name: "active", type: "bool" },
      ...timestamps(),
    ],
  });
  app.save(staff);
  staff.fields.getByName("password").min = 8;
  app.save(staff);
  const owner = () => ({ name: "owner", type: "relation", required: true,
    collectionId: staff.id, maxSelect: 1, cascadeDelete: false });
  app.save(new Collection({
    name: "storefronts", type: "base",
    listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [owner(),
      { name: "slug", type: "text", required: true, max: 80, pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" },
      { name: "display_name", type: "text", required: true, max: 120 },
      { name: "contact_name", type: "text", max: 120 },
      { name: "contact_email", type: "email" },
      { name: "contact_phone", type: "text", max: 40 },
      { name: "zalo_phone", type: "text", max: 40 },
      { name: "business_hours", type: "text", max: 300 },
      { name: "default_language", type: "select", required: true, maxSelect: 1, values: ["vi", "en", "zh"] },
      { name: "published", type: "bool" }, ...timestamps()],
    indexes: ["CREATE UNIQUE INDEX idx_storefront_owner ON storefronts (owner)",
      "CREATE UNIQUE INDEX idx_storefront_slug ON storefronts (slug)"],
  }));
  app.save(new Collection({
    name: "staff_settings", type: "base",
    listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [owner(),
      { name: "default_margin_cents", type: "number", min: 0, max: 1000000000, onlyInt: true },
      { name: "expiry_warning_days", type: "number", min: 0, max: 365, onlyInt: true },
      ...timestamps()],
    indexes: ["CREATE UNIQUE INDEX idx_staff_settings_owner ON staff_settings (owner)"],
  }));
}, (app) => {
  for (const name of ["staff_settings", "storefronts", "staff"]) {
    app.delete(app.findCollectionByNameOrId(name));
  }
});
