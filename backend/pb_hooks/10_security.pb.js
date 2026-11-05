/// <reference path="../pb_data/types.d.ts" />
onRecordValidate((e) => {
  require(__hooks + "/lib/security.js").validateRecord(e.app, e.record);
  e.next();
}, "storefronts", "staff_settings", "carriers", "ports", "routes", "route_margins", "rate_series",
"rate_versions", "rate_costs", "schedules", "rate_schedules", "search_daily_stats", "import_jobs");

onRecordUpdateRequest((e) => {
  if (!e.hasSuperuserAuth()) {
    require(__hooks + "/lib/validation.js").keys(e.requestInfo().body,
      ["name", "job_title", "phone", "email", "password", "passwordConfirm", "oldPassword"]);
  }
  e.next();
}, "staff");

onRecordEnrich((e) => {
  const v = require(__hooks + "/lib/validation.js");
  e.record.withCustomData(true);
  e.record.set("validity_status", v.status(e.record.getString("valid_from"), e.record.getString("valid_to"), v.today()));
  e.next();
}, "rate_versions");

// The application currently uses HTTP reads. Keep private data off SSE channels.
// Superuser dashboard subscriptions remain available for server operations.
onRealtimeSubscribeRequest((e) => {
  if (!e.hasSuperuserAuth()) throw new ForbiddenError("Application realtime subscriptions are disabled.");
  e.next();
});
