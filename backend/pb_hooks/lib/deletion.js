// Bulk deletion for the admin lists. Collections keep deleteRule = null (no direct API deletes);
// this module deletes inside one transaction and protects data other records still depend on.
//
//  rates      rate_versions (+ their rate_costs / rate_schedules). When the current revision of a
//             series is deleted, the newest remaining revision becomes current again; a series
//             with no revisions left is removed.
//  schedules  only voyages not linked to any price (the link holds the price-history snapshot).
//  carriers   only carriers without prices or voyages.
//  ports      only ports whose routes have no prices, voyages or search stats; those unused routes
//             (and their margin settings) are removed with the port.

const KINDS = ["rates", "schedules", "carriers", "ports"];
const MAX_IDS = 500;

function count(app, collection, filter, params) {
  return app.findRecordsByFilter(collection, filter, "", 1, 0, params).length;
}

function ownedOrNull(app, collection, id, owner) {
  try {
    const record = app.findRecordById(collection, id);
    return record.getString("owner") === owner ? record : null;
  } catch (_) {
    return null;
  }
}

function deleteRates(tx, owner, ids) {
  const touchedSeries = {};
  let deleted = 0;
  for (const id of ids) {
    const version = ownedOrNull(tx, "rate_versions", id, owner);
    if (!version) continue;
    for (const name of ["rate_costs", "rate_schedules"]) {
      for (const linked of tx.findRecordsByFilter(name, "rate_version = {:id}", "", 0, 0, { id })) tx.delete(linked);
    }
    touchedSeries[version.getString("series")] = true;
    tx.delete(version);
    deleted++;
  }
  for (const series of Object.keys(touchedSeries)) {
    const left = tx.findRecordsByFilter("rate_versions", "series = {:series}", "-revision", 0, 0, { series });
    if (!left.length) {
      const record = ownedOrNull(tx, "rate_series", series, owner);
      if (record) tx.delete(record);
    } else if (!left.some((r) => r.getBool("is_current"))) {
      left[0].set("is_current", true);
      tx.save(left[0]);
    }
  }
  return { deleted, skipped: [] };
}

function deleteSchedules(tx, owner, ids) {
  let deleted = 0;
  const skipped = [];
  for (const id of ids) {
    const record = ownedOrNull(tx, "schedules", id, owner);
    if (!record) continue;
    const label = [record.getString("vessel_name"), record.getString("voyage")].filter(Boolean).join(" / ");
    if (count(tx, "rate_schedules", "schedule = {:id}", { id })) {
      skipped.push({ id, label, reason: "đang gắn với dòng giá (dùng Hủy chuyến thay vì xoá)" });
      continue;
    }
    tx.delete(record);
    deleted++;
  }
  return { deleted, skipped };
}

function deleteCarriers(tx, owner, ids) {
  let deleted = 0;
  const skipped = [];
  for (const id of ids) {
    const record = ownedOrNull(tx, "carriers", id, owner);
    if (!record) continue;
    const label = record.getString("code");
    if (count(tx, "rate_series", "carrier = {:id}", { id }) || count(tx, "schedules", "carrier = {:id}", { id })) {
      skipped.push({ id, label, reason: "đang có dòng giá hoặc lịch tàu (hãy tắt Hiển thị)" });
      continue;
    }
    tx.delete(record);
    deleted++;
  }
  return { deleted, skipped };
}

function deletePorts(tx, owner, ids) {
  let deleted = 0;
  const skipped = [];
  for (const id of ids) {
    const record = ownedOrNull(tx, "ports", id, owner);
    if (!record) continue;
    const label = record.getString("name");
    const routes = tx.findRecordsByFilter("routes", "pol = {:id} || pod = {:id}", "", 0, 0, { id });
    const used = routes.some((route) => {
      const params = { route: route.id };
      return count(tx, "rate_series", "route = {:route}", params) || count(tx, "schedules", "route = {:route}", params) ||
        count(tx, "search_daily_stats", "route = {:route}", params);
    });
    if (used) {
      skipped.push({ id, label, reason: "thuộc tuyến đang có dòng giá hoặc lịch tàu (hãy tắt Hiển thị)" });
      continue;
    }
    for (const route of routes) {
      for (const margin of tx.findRecordsByFilter("route_margins", "route = {:route}", "", 0, 0, { route: route.id })) tx.delete(margin);
      tx.delete(route);
    }
    tx.delete(record);
    deleted++;
  }
  return { deleted, skipped };
}

function remove(app, owner, body) {
  require(__hooks + "/lib/validation.js").keys(body, ["kind", "ids"]);
  const kind = String(body.kind || "");
  if (!KINDS.includes(kind)) throw new BadRequestError("Loại dữ liệu không hợp lệ.");
  const ids = Array.isArray(body.ids) ? [...new Set(body.ids.map(String))] : [];
  if (!ids.length || ids.length > MAX_IDS || ids.some((id) => !/^[a-z0-9]{15}$/.test(id))) {
    throw new BadRequestError("Danh sách cần xoá không hợp lệ.");
  }
  const run = { rates: deleteRates, schedules: deleteSchedules, carriers: deleteCarriers, ports: deletePorts }[kind];
  let result;
  app.runInTransaction((tx) => {
    result = run(tx, owner, ids);
  });
  return result;
}

module.exports = { remove };
