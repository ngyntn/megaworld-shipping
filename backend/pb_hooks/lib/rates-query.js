const v = require(__hooks + "/lib/validation.js");
const q = require(__hooks + "/lib/query.js");
function search(app, owner, query, compare) {
  const options = q.paging(query, ["route", "carrier", "pol", "pod", "container_type", "sort", "status"]);
  if (compare && (!query.container_type || !(query.route || (query.pol && query.pod)))) throw new BadRequestError("Comparison requires route (or pol/pod) and container_type.");
  const params = { owner, today: v.today(), limit: options.size + 1, offset: options.offset };
  let filter = q.filters(query, "s", params);
  if (query.container_type) {
    if (!["20GP", "40GP", "40HC"].includes(query.container_type)) throw new BadRequestError("Invalid container_type.");
    params.container = query.container_type; filter += " AND s.container_type = {:container}";
  }
  const status = compare ? "valid" : query.status || "all";
  if (!["all", "valid", "upcoming", "expired"].includes(status) || (compare && query.status && query.status !== "valid")) throw new BadRequestError("Invalid status.");
  if (status === "valid") filter += " AND v.valid_from <= {:today} AND v.valid_to >= {:today}";
  if (status === "upcoming") filter += " AND v.valid_from > {:today}";
  if (status === "expired") filter += " AND v.valid_to < {:today}";
  const sorts = { price: "v.sell_price_cents", price_desc: "v.sell_price_cents DESC", transit: "v.transit_days",
    departure: "CASE WHEN next_etd = '' THEN 1 ELSE 0 END, next_etd" };
  if (query.sort && !sorts[query.sort]) throw new BadRequestError("Invalid sort.");
  const ordering = (compare ? "" : `CASE WHEN v.valid_from <= {:today} AND v.valid_to >= {:today} THEN 0 WHEN v.valid_from > {:today} THEN 1 ELSE 2 END, `) + (sorts[query.sort || "price"]) + ", v.id";
  const rows = q.rows(app, `SELECT v.id, COALESCE((SELECT MIN(sc.etd) FROM schedules sc
      WHERE sc.owner = v.owner AND sc.route = s.route AND sc.carrier = s.carrier
      AND sc.status = 'scheduled' AND sc.etd >= {:today} AND sc.etd >= v.valid_from AND sc.etd <= v.valid_to), '') AS next_etd
    FROM rate_versions v JOIN rate_series s ON s.id = v.series AND s.owner = v.owner AND s.active = 1 ` + q.joins +
    " WHERE v.owner = {:owner} AND v.is_current = 1" + filter + " ORDER BY " + ordering + " LIMIT {:limit} OFFSET {:offset}", params, { id: "", next_etd: "" });
  const read = require(__hooks + "/lib/rates-read.js");
  return q.page(rows, options, (row) => {
    const result = read.project(app, owner, app.findRecordById("rate_versions", row.id));
    result.next_departure = row.next_etd || null;
    return result;
  });
}
module.exports = { search };
