/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const authenticated = '@request.auth.collectionName = "staff" && @request.auth.active = true';
  const own = authenticated + ' && owner = @request.auth.id';
  const editable = ["storefronts", "staff_settings", "carriers", "ports", "routes", "route_margins"];
  const readOnly = ["rate_series", "rate_versions", "rate_costs", "schedules", "rate_schedules",
    "search_daily_stats", "import_jobs"];
  for (const name of [...editable, ...readOnly]) {
    const collection = app.findCollectionByNameOrId(name);
    collection.listRule = own;
    collection.viewRule = own;
    collection.createRule = editable.includes(name) ? authenticated + ' && @request.body.owner = @request.auth.id' : null;
    collection.updateRule = editable.includes(name) ? own + ' && @request.body.owner:changed = false' : null;
    // Keep historical references intact: deactivate catalog entries instead of deleting.
    collection.deleteRule = null;
    app.save(collection);
  }
  const staff = app.findCollectionByNameOrId("staff");
  staff.listRule = authenticated + ' && id = @request.auth.id';
  staff.viewRule = staff.listRule;
  staff.updateRule = staff.listRule + ' && @request.body.active:changed = false && @request.body.verified:changed = false';
  app.save(staff);
}, (app) => {
  for (const name of ["staff", "storefronts", "staff_settings", "carriers", "ports", "routes",
    "route_margins", "rate_series", "rate_versions", "rate_costs", "schedules", "rate_schedules",
    "search_daily_stats", "import_jobs"]) {
    const collection = app.findCollectionByNameOrId(name);
    for (const rule of ["listRule", "viewRule", "createRule", "updateRule", "deleteRule"]) collection[rule] = null;
    app.save(collection);
  }
});
