function configure(app) {
  const settings = app.settings();
  settings.meta.appName = "Megaworld Shipping";
  settings.meta.appURL = $os.getenv("PB_PUBLIC_URL");
  settings.logs.logIP = false;
  settings.logs.logAuthId = false;
  settings.logs.maxDays = 7;
  settings.trustedProxy.headers = ["X-Real-IP"];
  settings.trustedProxy.useLeftmostIP = false;
  settings.rateLimits.enabled = true;
  settings.rateLimits.rules = [
    { label: "/api/collections/staff/auth-with-password", audience: "", duration: 60, maxRequests: 10 },
    { label: "POST /api/megaworld/admin/imports/", audience: "", duration: 60, maxRequests: 10 },
    { label: "/api/", audience: "", duration: 60, maxRequests: 300 },
  ];
  settings.backups.cron = "0 19 * * *"; // 02:00 Vietnam, scheduler UTC.
  settings.backups.cronMaxKeep = 7;
  app.save(settings);
}
module.exports = { configure };
