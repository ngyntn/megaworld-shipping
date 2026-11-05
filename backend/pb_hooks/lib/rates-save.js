const v = require(__hooks + "/lib/validation.js");
const security = require(__hooks + "/lib/security.js");

function find(app, collection, filter, params) {
  return app.findRecordsByFilter(collection, filter, "", 1, 0, params)[0] || null;
}

function validate(body) {
  v.keys(body, ["route", "carrier", "valid_from", "valid_to", "service_type", "transit_days",
    "local_charges", "surcharges", "trade_term", "cargo_type", "public_note", "internal_note", "schedule_ids", "lines"]);
  v.id(body.route, "route");
  v.id(body.carrier, "carrier");
  v.day(body.valid_from, "valid_from");
  v.day(body.valid_to, "valid_to");
  if (body.valid_from > body.valid_to) throw new BadRequestError("valid_to must not precede valid_from.");
  if (!["direct", "transit"].includes(body.service_type)) throw new BadRequestError("Invalid service_type.");
  if (!Number.isInteger(body.transit_days) || body.transit_days < 0 || body.transit_days > 365) {
    throw new BadRequestError("transit_days must be between 0 and 365.");
  }
  for (const name of ["local_charges", "surcharges"]) v.text(body[name], name, 2000);
  v.text(body.trade_term, "trade_term", 20);
  v.text(body.cargo_type, "cargo_type", 40);
  v.text(body.public_note, "public_note", 4000);
  v.text(body.internal_note, "internal_note", 8000);
  if (!Array.isArray(body.lines) || !body.lines.length || body.lines.length > 3) throw new BadRequestError("Provide 1–3 container lines.");
  const seen = {};
  for (const line of body.lines) {
    v.keys(line, ["container_type", "cost_price_cents", "margin_mode", "margin_cents", "expected_revision"]);
    if (!["20GP", "40GP", "40HC"].includes(line.container_type) || seen[line.container_type]) {
      throw new BadRequestError("Invalid or duplicated container_type.");
    }
    seen[line.container_type] = true;
    v.cents(line.cost_price_cents, "cost_price_cents");
    if (!["default", "route", "row"].includes(line.margin_mode)) throw new BadRequestError("Invalid margin_mode.");
    if (line.margin_mode === "row") v.cents(line.margin_cents, "margin_cents");
    else if (line.margin_cents !== undefined) throw new BadRequestError("margin_cents is only accepted in row mode.");
    if (!Number.isInteger(line.expected_revision) || line.expected_revision < 0) throw new BadRequestError("expected_revision is required (0 for new series).");
  }
  if (body.schedule_ids !== undefined && (!Array.isArray(body.schedule_ids) || body.schedule_ids.length > 100)) {
    throw new BadRequestError("schedule_ids must contain at most 100 ids.");
  }
  const scheduleIds = body.schedule_ids || [];
  if (new Set(scheduleIds).size !== scheduleIds.length) throw new BadRequestError("Duplicate schedule ids.");
  scheduleIds.forEach((id) => v.id(id, "schedule_id"));
}

function margin(app, owner, route, line) {
  if (line.margin_mode === "row") return { amount: line.margin_cents, source: "row" };
  if (line.margin_mode === "route") {
    const setting = find(app, "route_margins", "owner = {:owner} && route = {:route}", { owner, route });
    if (setting) return { amount: setting.getInt("margin_cents"), source: "route" };
  }
  const defaults = find(app, "staff_settings", "owner = {:owner}", { owner });
  if (!defaults) throw new BadRequestError("Configure a default margin or provide a row margin.");
  return { amount: defaults.getInt("default_margin_cents"), source: "default" };
}

function create(app, collection, values) {
  const record = new Record(app.findCollectionByNameOrId(collection));
  record.load(values);
  app.save(record);
  return record;
}

function save(app, owner, body) {
  validate(body);
  const result = [];
  app.runInTransaction((tx) => {
    security.active(tx, "routes", body.route, owner);
    security.active(tx, "carriers", body.carrier, owner);
    const route = security.owned(tx, "routes", body.route, owner);
    security.active(tx, "ports", route.getString("pol"), owner);
    security.active(tx, "ports", route.getString("pod"), owner);
    const schedules = (body.schedule_ids || []).map((id) => {
      const schedule = security.owned(tx, "schedules", id, owner);
      if (schedule.getString("route") !== body.route || schedule.getString("carrier") !== body.carrier ||
          schedule.getString("status") !== "scheduled" || schedule.getString("etd") < body.valid_from || schedule.getString("etd") > body.valid_to) {
        throw new BadRequestError("Schedule must match the route/carrier and depart within validity.");
      }
      return schedule;
    });
    for (const line of body.lines) {
      const key = { owner, route: body.route, carrier: body.carrier, container: line.container_type };
      let series = find(tx, "rate_series", "owner = {:owner} && route = {:route} && carrier = {:carrier} && container_type = {:container}", key);
      let current = series && find(tx, "rate_versions", "series = {:series} && is_current = true", { series: series.id });
      const revision = current ? current.getInt("revision") : 0;
      if (line.expected_revision !== revision) throw new ApiError(409, "Price was updated by another request; reload before saving.");
      if (series && !series.getBool("active")) throw new BadRequestError("Rate series is inactive.");
      const profit = margin(tx, owner, body.route, line);
      const sell = v.cents(line.cost_price_cents + profit.amount, "sell_price_cents");
      if (!series) series = create(tx, "rate_series", { owner, route: body.route, carrier: body.carrier, container_type: line.container_type, active: true });
      if (current) {
        current.set("is_current", false);
        tx.save(current);
      }
      const fields = { owner, series: series.id, revision: revision + 1, is_current: true, sell_price_cents: sell };
      for (const name of ["valid_from", "valid_to", "service_type", "transit_days", "local_charges", "surcharges", "trade_term", "cargo_type", "public_note"]) {
        if (body[name] !== undefined) fields[name] = body[name];
      }
      const version = create(tx, "rate_versions", fields);
      create(tx, "rate_costs", { owner, rate_version: version.id, cost_price_cents: line.cost_price_cents,
        margin_cents: profit.amount, margin_source: profit.source, internal_note: body.internal_note || "" });
      for (const schedule of schedules) {
        const snapshot = {};
        for (const name of ["vessel_name", "voyage", "etd", "eta", "service_type", "transshipment_port"]) snapshot[name] = schedule.getString(name);
        create(tx, "rate_schedules", { owner, rate_version: version.id, schedule: schedule.id, snapshot });
      }
      result.push({ id: version.id, series: series.id, container_type: line.container_type,
        revision: revision + 1, sell_price_cents: sell, validity_status: v.status(body.valid_from, body.valid_to, v.today()) });
    }
  });
  return { items: result };
}

function duplicate(app, owner, id) {
  const version = security.owned(app, "rate_versions", v.id(id, "rate_version"), owner);
  const series = security.owned(app, "rate_series", version.getString("series"), owner);
  const cost = find(app, "rate_costs", "rate_version = {:id} && owner = {:owner}", { id, owner });
  if (!cost) throw new NotFoundError("Private price details not found.");
  const current = find(app, "rate_versions", "series = {:series} && is_current = true", { series: series.id });
  const payload = { route: series.getString("route"), carrier: series.getString("carrier"),
    internal_note: cost.getString("internal_note"), schedule_ids: [], lines: [{ container_type: series.getString("container_type"),
      cost_price_cents: cost.getInt("cost_price_cents"), margin_mode: "row", margin_cents: cost.getInt("margin_cents"),
      expected_revision: current ? current.getInt("revision") : 0 }] };
  for (const name of ["valid_from", "valid_to", "service_type", "local_charges", "surcharges", "trade_term", "cargo_type", "public_note"]) payload[name] = version.getString(name);
  payload.transit_days = version.getInt("transit_days");
  return payload;
}

function preview(app, owner, body) {
  let result, completed = false;
  try {
    app.runInTransaction((tx) => {
      result = save(tx, owner, body);
      completed = true;
      // Roll back a successful dry run, including versions, costs and snapshots.
      throw new Error("preview_rollback");
    });
  } catch (error) { if (!completed) throw error; }
  return result;
}
module.exports = { save, duplicate, preview };
