const v = require(__hooks + "/lib/validation.js");
const q = require(__hooks + "/lib/query.js");
function count(app, table, where, params) {
  return q.rows(app, "SELECT COUNT(*) AS n FROM " + table + " WHERE " + where, params, { n: 0 })[0].n;
}
function describe(app, owner, version) {
  const sec = require(__hooks + "/lib/security.js");
  const series = sec.owned(app, "rate_series", version.getString("series"), owner);
  const route = sec.owned(app, "routes", series.getString("route"), owner);
  const carrier = sec.owned(app, "carriers", series.getString("carrier"), owner);
  return { id: version.id, series: series.id, route: route.id,
    pol: sec.owned(app, "ports", route.getString("pol"), owner).getString("name"),
    pod: sec.owned(app, "ports", route.getString("pod"), owner).getString("name"), carrier: carrier.getString("code"),
    container_type: series.getString("container_type"), sell_price_cents: version.getInt("sell_price_cents"),
    valid_from: version.getString("valid_from"), valid_to: version.getString("valid_to"), created: version.getString("created") };
}
function dashboard(app, owner, query) {
  v.keys(query, []);
  const today = v.today();
  const since = new Date(Date.parse(today) - 6 * 86400000).toISOString().slice(0, 10);
  const sinceUTC = new Date(Date.parse(since) - 7 * 3600000).toISOString().replace("T", " ");
  const params = { owner, today, since, sinceUTC };
  const settings = app.findRecordsByFilter("staff_settings", "owner = {:owner}", "", 1, 0, { owner });
  const warning = settings.length ? settings[0].getInt("expiry_warning_days") : 7;
  params.until = new Date(Date.parse(today) + warning * 86400000).toISOString().slice(0, 10);
  const joined = "rate_versions v JOIN rate_series s ON s.id = v.series AND s.owner = v.owner AND s.active = 1 " + q.joins;
  const current = "v.owner = {:owner} AND v.is_current = 1";
  const movementSQL = `SELECT v.id, p.sell_price_cents AS previous FROM ${joined}
    JOIN rate_versions p ON p.series = v.series AND p.owner = v.owner AND p.revision = v.revision - 1
    WHERE ${current} AND ((p.sell_price_cents > 0 AND ABS(v.sell_price_cents - p.sell_price_cents) * 10 >= p.sell_price_cents)
      OR (p.sell_price_cents = 0 AND v.sell_price_cents > 0))`;
  const movements = q.rows(app, movementSQL + " ORDER BY ABS(v.sell_price_cents - p.sell_price_cents) DESC, v.id LIMIT 5", params, { id: "", previous: 0 })
    .map((row) => { const item = describe(app, owner, app.findRecordById("rate_versions", row.id));
      item.previous_sell_price_cents = row.previous; item.change_cents = item.sell_price_cents - row.previous;
      item.change_percent = row.previous ? item.change_cents * 100 / row.previous : null; return item; });
  const load = (sql) => q.rows(app, sql, params).map((row) => describe(app, owner, app.findRecordById("rate_versions", row.id)));
  const top = q.rows(app, "SELECT route, SUM(search_count) AS searches FROM search_daily_stats WHERE owner = {:owner} AND day >= {:since} AND day <= {:today} GROUP BY route ORDER BY searches DESC, route LIMIT 5", params, { route: "", searches: 0 });
  return { today, period_from: since, expiry_warning_days: warning, summary: {
    updated_last_7_days: count(app, "rate_versions", "owner = {:owner} AND created >= {:sinceUTC}", params),
    valid_rates: count(app, joined, current + " AND v.valid_from <= {:today} AND v.valid_to >= {:today}", params),
    significant_changes: q.rows(app, "SELECT COUNT(*) AS n FROM (" + movementSQL + ")", params, { n: 0 })[0].n },
    latest_rates: load("SELECT id FROM rate_versions WHERE owner = {:owner} ORDER BY created DESC, id LIMIT 5"),
    expiring_rates: load("SELECT v.id FROM " + joined + " WHERE " + current + " AND v.valid_from <= {:today} AND v.valid_to >= {:today} AND v.valid_to <= {:until} ORDER BY v.valid_to, v.id LIMIT 5"),
    top_routes: top.map((row) => { const route = app.findRecordById("routes", row.route); return { route: row.route, searches: row.searches,
      pol: app.findRecordById("ports", route.getString("pol")).getString("name"), pod: app.findRecordById("ports", route.getString("pod")).getString("name") }; }),
    significant_changes: movements };
}
function search(app, owner, body) {
  v.keys(body, ["route"]); v.id(body.route, "route");
  const sec = require(__hooks + "/lib/security.js");
  app.runInTransaction((tx) => {
    const route = sec.active(tx, "routes", body.route, owner);
    sec.active(tx, "ports", route.getString("pol"), owner); sec.active(tx, "ports", route.getString("pod"), owner);
    const records = tx.findRecordsByFilter("search_daily_stats", "owner = {:owner} && route = {:route} && day = {:day}", "", 1, 0, { owner, route: body.route, day: v.today() });
    const record = records[0] || new Record(tx.findCollectionByNameOrId("search_daily_stats"));
    record.load({ owner, route: body.route, day: v.today(), search_count: record.getInt("search_count") + 1 }); tx.save(record);
  });
  return { recorded: true };
}
module.exports = { dashboard, search };
