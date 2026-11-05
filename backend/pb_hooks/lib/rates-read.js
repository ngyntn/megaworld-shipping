const v = require(__hooks + "/lib/validation.js");
const security = require(__hooks + "/lib/security.js");

function paging(query) {
  v.keys(query, ["page", "per_page"]);
  const page = query.page === undefined ? 1 : Number(query.page);
  const size = query.per_page === undefined ? 20 : Number(query.per_page);
  if (!Number.isInteger(page) || page < 1 || page > 10000 || !Number.isInteger(size) || size < 1 || size > 100) {
    throw new BadRequestError("Invalid pagination.");
  }
  return { page, size, offset: (page - 1) * size };
}

function seriesDetails(app, owner, series) {
  const route = security.active(app, "routes", series.getString("route"), owner);
  const carrier = security.active(app, "carriers", series.getString("carrier"), owner);
  const pol = security.active(app, "ports", route.getString("pol"), owner);
  const pod = security.active(app, "ports", route.getString("pod"), owner);
  const port = (record) => ({ id: record.id, code: record.getString("code"), name: record.getString("name"),
    name_en: record.getString("name_en"), name_zh: record.getString("name_zh") });
  return { series: series.id, container_type: series.getString("container_type"),
    route: { id: route.id, pol: port(pol), pod: port(pod) },
    carrier: { id: carrier.id, code: carrier.getString("code"), name: carrier.getString("name"),
      name_en: carrier.getString("name_en"), name_zh: carrier.getString("name_zh"), logo: carrier.getString("logo"), collection_id: carrier.collection().id } };
}

function project(app, owner, version) {
  const series = security.active(app, "rate_series", version.getString("series"), owner);
  const result = Object.assign({ id: version.id, currency: "USD" }, seriesDetails(app, owner, series));
  for (const field of ["valid_from", "valid_to", "service_type", "local_charges", "surcharges", "trade_term", "cargo_type", "public_note"]) result[field] = version.getString(field);
  result.revision = version.getInt("revision");
  result.is_current = version.getBool("is_current");
  result.sell_price_cents = version.getInt("sell_price_cents");
  result.transit_days = version.getInt("transit_days");
  result.validity_status = v.status(result.valid_from, result.valid_to, v.today());
  return result;
}

function list(app, slug, query) {
  const shop = security.storefront(app, slug);
  return require(__hooks + "/lib/rates-query.js").search(app, shop.getString("owner"), query, false);
}

function history(app, slug, id, query) {
  const shop = security.storefront(app, slug);
  const owner = shop.getString("owner");
  const series = security.active(app, "rate_series", v.id(id, "series"), owner);
  seriesDetails(app, owner, series);
  const page = paging(query);
  const records = app.findRecordsByFilter("rate_versions", "owner = {:owner} && series = {:series}",
    "-revision", page.size + 1, page.offset, { owner, series: series.id });
  const items = records.slice(0, page.size).map((record) => {
    const result = project(app, owner, record);
    const previous = app.findRecordsByFilter("rate_versions", "owner = {:owner} && series = {:series} && revision < {:revision}",
      "-revision", 1, 0, { owner, series: series.id, revision: record.getInt("revision") });
    result.previous_sell_price_cents = previous.length ? previous[0].getInt("sell_price_cents") : null;
    result.change_cents = previous.length ? result.sell_price_cents - result.previous_sell_price_cents : null;
    const links = app.findRecordsByFilter("rate_schedules", "owner = {:owner} && rate_version = {:id}", "id", 100, 0, { owner, id: record.id });
    result.schedules = links.map((link) => {
      const data = JSON.parse(link.getString("snapshot"));
      const safe = {};
      for (const key of ["vessel_name", "voyage", "etd", "eta", "service_type", "transshipment_port"]) safe[key] = data[key] || "";
      return safe;
    });
    return result;
  });
  return { page: page.page, per_page: page.size, has_more: records.length > page.size, items };
}

function storefront(app, slug) {
  const shop = security.storefront(app, slug);
  const result = {};
  for (const field of ["slug", "display_name", "contact_name", "contact_email", "contact_phone", "zalo_phone", "business_hours", "default_language"]) result[field] = shop.getString(field);
  return result;
}

module.exports = { list, history, storefront, project };
