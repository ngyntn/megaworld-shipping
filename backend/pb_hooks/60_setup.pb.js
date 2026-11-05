routerAdd("POST", "/api/megaworld/admin/setup/catalog", (e) => {
  const owner = require(__hooks + "/lib/security.js").staff(e);
  require(__hooks + "/lib/validation.js").keys(e.requestInfo().body, []);
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/seed-catalog.js").seed(e.app, owner));
}, $apis.requireAuth("staff"), $apis.bodyLimit(1024));

$app.rootCmd.addCommand(new Command({ use: "megaworld-demo", short: "Seed an isolated local demo database", run: (cmd, args) => {
  try {
    if (!$app.isBootstrapped()) $app.bootstrap();
    require(__hooks + "/lib/seed-demo.js").seed($app);
  } catch (error) {
    console.error("Demo setup failed: " + error.message);
    $os.exit(1);
  }
} }));
