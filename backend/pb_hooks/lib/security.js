function staff(event) {
  if (!event.auth || event.auth.collection().name !== "staff") throw new UnauthorizedError("Staff authentication required.");
  const account = event.app.findRecordById("staff", event.auth.id);
  if (!account.getBool("active")) throw new ForbiddenError("Account is disabled.");
  return account.id;
}

function owned(app, collection, id, owner) {
  let record;
  try { record = app.findRecordById(collection, id); } catch (_) { throw new NotFoundError("Record not found."); }
  if (record.getString("owner") !== owner) throw new NotFoundError("Record not found.");
  return record;
}

function active(app, collection, id, owner) {
  const record = owned(app, collection, id, owner);
  if (!record.getBool("active")) throw new BadRequestError("Selected " + collection + " is inactive.");
  return record;
}

function storefront(app, slug) {
  const records = app.findRecordsByFilter("storefronts", "slug = {:slug} && published = true", "", 1, 0, { slug });
  if (!records.length) throw new NotFoundError("Storefront not found.");
  const record = records[0];
  const account = app.findRecordById("staff", record.getString("owner"));
  if (!account.getBool("active")) throw new NotFoundError("Storefront not found.");
  return record;
}

function validateRecord(app, record) {
  const name = record.collection().name;
  const owner = record.getString("owner");
  if (!owner) throw new BadRequestError("Owner is required.");
  if (!record.isNew() && record.original().getString("owner") !== owner) {
    throw new BadRequestError("Owner cannot be changed.");
  }
  const references = {
    routes: { pol: "ports", pod: "ports" }, route_margins: { route: "routes" },
    rate_series: { route: "routes", carrier: "carriers" }, rate_versions: { series: "rate_series" },
    rate_costs: { rate_version: "rate_versions" }, schedules: { route: "routes", carrier: "carriers" },
    rate_schedules: { rate_version: "rate_versions", schedule: "schedules" }, search_daily_stats: { route: "routes" },
  };
  for (const field of Object.keys(references[name] || {})) {
    owned(app, references[name][field], record.getString(field), owner);
  }
  if (name === "routes") {
    const pol = owned(app, "ports", record.getString("pol"), owner);
    const pod = owned(app, "ports", record.getString("pod"), owner);
    if (pol.id === pod.id || !pol.getBool("can_be_pol") || pol.getString("country_code") !== "VN" || !pod.getBool("can_be_pod")) {
      throw new BadRequestError("Invalid export route origin/destination.");
    }
    if (!record.isNew() && ["pol", "pod"].some((field) => record.original().getString(field) !== record.getString(field))) {
      throw new BadRequestError("Create a new route instead of changing its ports.");
    }
  }
  const v = require(__hooks + "/lib/validation.js");
  if (name === "rate_versions" || name === "schedules") {
    const from = name === "schedules" ? "etd" : "valid_from";
    const to = name === "schedules" ? "eta" : "valid_to";
    v.day(record.getString(from), from);
    v.day(record.getString(to), to);
    if (record.getString(from) > record.getString(to)) throw new BadRequestError(to + " must not precede " + from + ".");
  }
  if (name === "search_daily_stats") v.day(record.getString("day"), "day");
}

module.exports = { staff, owned, active, storefront, validateRecord };
