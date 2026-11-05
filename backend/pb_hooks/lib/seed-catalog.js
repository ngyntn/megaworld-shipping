const sec = require(__hooks + "/lib/security.js");
function existing(app, collection, owner, code) {
  return app.findRecordsByFilter(collection, "owner = {:owner} && code = {:code}", "", 1, 0, { owner, code })[0];
}
function seed(app, owner) {
  const account = app.findRecordById("staff", owner);
  if (!account.getBool("active")) throw new ForbiddenError("Account is disabled.");
  const root = __hooks + "/../seed/";
  const carriers = JSON.parse(toString($os.readFile(root + "carriers.json")));
  const ports = toString($os.readFile(root + "ports.csv")).trim().split(/\r?\n/).slice(1);
  const result = { carriers: { created: 0, skipped: 0 }, ports: { created: 0, skipped: 0 } };
  app.runInTransaction((tx) => {
    for (const input of carriers) {
      if (existing(tx, "carriers", owner, input.code)) { result.carriers.skipped++; continue; }
      const record = new Record(tx.findCollectionByNameOrId("carriers"));
      record.load({ owner, code: input.code, name: input.name, name_en: input.name, active: true });
      record.set("logo", $filesystem.fileFromPath(root + "logos/" + input.code.replace(/ /g, "-") + ".png"));
      tx.save(record); result.carriers.created++;
    }
    for (const line of ports) {
      const [code, name, country, region, isOrigin, unlocode] = line.split("|");
      if (existing(tx, "ports", owner, code)) { result.ports.skipped++; continue; }
      const record = new Record(tx.findCollectionByNameOrId("ports"));
      record.load({ owner, code, name, name_en: isOrigin === "true" ? "" : name, country_code: country,
        region, can_be_pol: isOrigin === "true", can_be_pod: isOrigin !== "true", unlocode: unlocode || "", active: true });
      tx.save(record); result.ports.created++;
    }
  });
  return result;
}
module.exports = { seed, existing };
