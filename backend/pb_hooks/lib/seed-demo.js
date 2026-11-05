function seed(app) {
  if ($os.getenv("PB_DEMO_MODE") !== "true" || !/[\\/]demo_data$/.test(app.dataDir())) throw new Error("Demo seed is restricted to an isolated demo_data directory.");
  const found = app.findRecordsByFilter("staff", 'email = "demo@example.test"', "", 1, 0);
  if (found.length) { console.log("Demo already exists; no sample data was overwritten."); return; }
  const password = $os.getenv("PB_DEMO_PASSWORD");
  if (!password || password.length < 16) throw new Error("PB_DEMO_PASSWORD must contain at least 16 characters.");
  app.runInTransaction((tx) => {
    const account = new Record(tx.findCollectionByNameOrId("staff"));
    account.load({ email: "demo@example.test", name: "DEMO - sample pricing", active: true }); account.setPassword(password); tx.save(account);
    const owner = account.id;
    const catalog = require(__hooks + "/lib/seed-catalog.js"); catalog.seed(tx, owner);
    const create = (name, fields) => { const record = new Record(tx.findCollectionByNameOrId(name)); record.load({ owner, ...fields }); tx.save(record); return record; };
    create("storefronts", { slug: "megaworld-demo", display_name: "DEMO - fictitious prices and schedules", default_language: "vi", published: true,
      contact_name: "DEMO - no real contact", contact_email: "demo@example.test" });
    create("staff_settings", { default_margin_cents: 15000, expiry_warning_days: 7 });
    const port = (code) => catalog.existing(tx, "ports", owner, code).id;
    const carrier = (code) => catalog.existing(tx, "carriers", owner, code).id;
    const route = create("routes", { pol: port("CAT_LAI"), pod: port("USLAX"), active: true });
    const v = require(__hooks + "/lib/validation.js");
    const day = (offset) => new Date(Date.parse(v.today()) + offset * 86400000).toISOString().slice(0, 10);
    const rates = require(__hooks + "/lib/rates-save.js");
    for (const [index, code] of ["ONE", "MSC", "WHL"].entries()) {
      const schedule = create("schedules", { route: route.id, carrier: carrier(code), vessel_name: "DEMO VESSEL " + code,
        voyage: "DEMO001", etd: day(5 + index), eta: day(23 + index), service_type: "direct", status: "scheduled", revision: 1,
        public_note: "DEMO - fictitious sailing" });
      for (const container of ["20GP", "40GP", "40HC"]) {
        const base = { route: route.id, carrier: carrier(code), service_type: "direct", transit_days: 18 + index,
          public_note: "DEMO - fictitious price, not a commercial offer", internal_note: "DEMO private cost",
          lines: [{ container_type: container, cost_price_cents: 180000 + index * 10000, margin_mode: "default", expected_revision: 0 }] };
        if (container === "40HC") {
          rates.save(tx, owner, { ...base, valid_from: day(-60), valid_to: day(-31), schedule_ids: [] });
          base.lines[0].expected_revision = 1; base.lines[0].cost_price_cents += 10000;
        }
        const expired = code === "ONE" && container === "20GP", upcoming = code === "ONE" && container === "40GP";
        rates.save(tx, owner, { ...base, valid_from: day(expired ? -30 : upcoming ? 1 : 0), valid_to: day(expired ? -1 : 30), schedule_ids: expired ? [] : [schedule.id] });
      }
    }
  });
  console.log("Created isolated demo: 15 carriers, 79 ports, 3 schedules, 12 price versions.");
}
module.exports = { seed };
