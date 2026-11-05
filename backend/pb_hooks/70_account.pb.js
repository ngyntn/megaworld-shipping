/// <reference path="../pb_data/types.d.ts" />
routerAdd("POST", "/api/megaworld/admin/account/email", (e) => {
  const staffId = require(__hooks + "/lib/security.js").staff(e);
  e.response.header().set("Cache-Control", "no-store");
  const result = require(__hooks + "/lib/account.js").changeEmail(e.app, staffId, e.requestInfo().body);
  return e.json(result.status, result.body);
}, $apis.requireAuth("staff"), $apis.bodyLimit(2048));
routerAdd("POST", "/api/megaworld/admin/delete", (e) => {
  const owner = require(__hooks + "/lib/security.js").staff(e);
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/deletion.js").remove(e.app, owner, e.requestInfo().body));
}, $apis.requireAuth("staff"), $apis.bodyLimit(16384));
