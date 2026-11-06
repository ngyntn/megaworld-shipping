/// <reference path="../pb_data/types.d.ts" />
// "Không gian của tôi": personal calendar, personal notes and saved quotes of each staff account.
migrate((app) => {
  const authenticated = '@request.auth.collectionName = "staff" && @request.auth.active = true';
  const own = authenticated + ' && owner = @request.auth.id';
  const day = (name) => ({ name, type: "text", required: true, pattern: "^\\d{4}-\\d{2}-\\d{2}$", max: 10 });
  const select = (name, values) => ({ name, type: "select", required: true, maxSelect: 1, values });
  const create = (name, fields, indexes) => app.save(new Collection({
    name, type: "base",
    listRule: own, viewRule: own,
    createRule: authenticated + ' && @request.body.owner = @request.auth.id',
    updateRule: own + ' && @request.body.owner:changed = false',
    deleteRule: own,
    fields: [{ name: "owner", type: "relation", required: true, maxSelect: 1, cascadeDelete: true,
      collectionId: app.findCollectionByNameOrId("staff").id }, ...fields,
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true }], indexes,
  }));
  create("workspace_events", [
    { name: "title", type: "text", required: true, max: 200 },
    day("day"),
    { name: "time", type: "text", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", max: 5 },
    select("category", ["customer", "rate", "schedule", "other"])],
    ["CREATE INDEX idx_workspace_event_day ON workspace_events (owner, day, time)"]);
  create("workspace_notes", [
    { name: "title", type: "text", required: true, max: 120 },
    { name: "body", type: "text", max: 2000 },
    select("color", ["yellow", "blue", "green"])],
    ["CREATE INDEX idx_workspace_note_owner ON workspace_notes (owner, updated)"]);
  // A snapshot: the quote keeps its price even after the rate is edited or deleted.
  create("saved_quotes", [
    { name: "rate_version", type: "text", required: true, pattern: "^[a-z0-9]{15}$", max: 15 },
    { name: "route_label", type: "text", required: true, max: 200 },
    { name: "carrier_code", type: "text", required: true, max: 40 },
    { name: "container_type", type: "text", required: true, max: 10 },
    { name: "price_cents", type: "number", min: 0, max: 1000000000, onlyInt: true },
    day("valid_to")],
    ["CREATE UNIQUE INDEX idx_saved_quote_version ON saved_quotes (owner, rate_version)",
      "CREATE INDEX idx_saved_quote_owner ON saved_quotes (owner, created)"]);
}, (app) => {
  for (const name of ["saved_quotes", "workspace_notes", "workspace_events"]) {
    app.delete(app.findCollectionByNameOrId(name));
  }
});
