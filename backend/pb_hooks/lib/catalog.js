const q = require(__hooks + "/lib/query.js");
function list(app, owner, type, query) {
  if (!["ports", "carriers", "routes"].includes(type)) throw new NotFoundError("Catalog not found.");
  const page = q.paging(query);
  const records = app.findRecordsByFilter(type, "owner = {:owner} && active = true", "id", page.size + 1, page.offset, { owner });
  return q.page(records, page, (record) => {
    const item = { id: record.id };
    const fields = type === "ports" ? ["code", "unlocode", "name", "name_en", "name_zh", "country_code", "region"] : type === "carriers" ? ["code", "name", "name_en", "name_zh", "logo"] : ["pol", "pod"];
    for (const field of fields) item[field] = record.getString(field);
    if (type === "ports") { item.can_be_pol = record.getBool("can_be_pol"); item.can_be_pod = record.getBool("can_be_pod"); }
    if (type === "carriers") item.collection_id = record.collection().id;
    return item;
  });
}
module.exports = { list };
