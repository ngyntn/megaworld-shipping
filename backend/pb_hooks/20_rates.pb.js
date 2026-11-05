/// <reference path="../pb_data/types.d.ts" />
routerAdd("POST", "/api/megaworld/admin/rates", (e) => {
  e.response.header().set("Cache-Control", "no-store");
  const owner = require(__hooks + "/lib/security.js").staff(e);
  const result = require(__hooks + "/lib/rates-save.js").save(e.app, owner, e.requestInfo().body);
  return e.json(201, result);
}, $apis.requireAuth("staff"), $apis.bodyLimit(65536));

routerAdd("GET", "/api/megaworld/admin/rates/{id}/duplicate", (e) => {
  e.response.header().set("Cache-Control", "no-store");
  const owner = require(__hooks + "/lib/security.js").staff(e);
  return e.json(200, require(__hooks + "/lib/rates-save.js").duplicate(e.app, owner, e.request.pathValue("id")));
}, $apis.requireAuth("staff"));
