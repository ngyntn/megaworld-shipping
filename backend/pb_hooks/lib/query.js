const v = require(__hooks + "/lib/validation.js");
function paging(query, allowed) {
  v.keys(query, ["page", "per_page", ...(allowed || [])]);
  const page = query.page === undefined ? 1 : Number(query.page);
  const size = query.per_page === undefined ? 20 : Number(query.per_page);
  if (!Number.isInteger(page) || page < 1 || page > 10000 || !Number.isInteger(size) || size < 1 || size > 100) throw new BadRequestError("Invalid pagination.");
  return { page, size, offset: (page - 1) * size };
}
function filters(query, alias, params) {
  let sql = "";
  for (const key of ["route", "carrier", "pol", "pod"]) {
    if (query[key] !== undefined) {
      params[key] = v.id(query[key], key);
      sql += " AND " + (key === "pol" || key === "pod" ? "r." : alias + ".") + key + " = {:" + key + "}";
    }
  }
  return sql;
}
function rows(app, sql, params, model) {
  const result = arrayOf(new DynamicModel(model || { id: "" }));
  app.db().newQuery(sql).bind(params).all(result);
  return result;
}
function page(items, options, project) {
  return { page: options.page, per_page: options.size, has_more: items.length > options.size,
    items: items.slice(0, options.size).map(project || ((x) => x)) };
}
const joins = ` JOIN routes r ON r.id = s.route AND r.owner = s.owner AND r.active = 1
 JOIN carriers c ON c.id = s.carrier AND c.owner = s.owner AND c.active = 1
 JOIN ports pol ON pol.id = r.pol AND pol.owner = r.owner AND pol.active = 1
 JOIN ports pod ON pod.id = r.pod AND pod.owner = r.owner AND pod.active = 1 `;
module.exports = { paging, filters, rows, page, joins };
