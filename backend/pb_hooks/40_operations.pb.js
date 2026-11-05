routerAdd("POST", "/api/megaworld/admin/schedules", (e) => {
  const owner = require(__hooks + "/lib/security.js").staff(e);
  e.response.header().set("Cache-Control", "no-store");
  return e.json(201, require(__hooks + "/lib/schedules.js").save(e.app, owner, e.requestInfo().body));
}, $apis.requireAuth("staff"), $apis.bodyLimit(16384));
routerAdd("PATCH", "/api/megaworld/admin/schedules/{id}", (e) => {
  const owner = require(__hooks + "/lib/security.js").staff(e);
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/schedules.js").save(e.app, owner, e.requestInfo().body, e.request.pathValue("id")));
}, $apis.requireAuth("staff"), $apis.bodyLimit(16384));
routerAdd("GET", "/api/megaworld/admin/schedules", (e) => {
  const owner = require(__hooks + "/lib/security.js").staff(e);
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/schedules.js").list(e.app, owner, e.requestInfo().query, false));
}, $apis.requireAuth("staff"));
routerAdd("GET", "/api/megaworld/admin/dashboard", (e) => {
  const owner = require(__hooks + "/lib/security.js").staff(e);
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/dashboard.js").dashboard(e.app, owner, e.requestInfo().query));
}, $apis.requireAuth("staff"));
routerAdd("GET", "/api/megaworld/admin/imports/template", (e) => {
  require(__hooks + "/lib/security.js").staff(e);
  return require(__hooks + "/lib/imports.js").template(e);
}, $apis.requireAuth("staff"));
routerAdd("POST", "/api/megaworld/admin/imports/preview", (e) => {
  const owner = require(__hooks + "/lib/security.js").staff(e);
  e.response.header().set("Cache-Control", "no-store");
  return e.json(201, require(__hooks + "/lib/imports.js").preview(e.app, owner, e.requestInfo().body));
}, $apis.requireAuth("staff"), $apis.bodyLimit(3000000));
routerAdd("POST", "/api/megaworld/admin/imports/{id}/commit", (e) => {
  const owner = require(__hooks + "/lib/security.js").staff(e);
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/imports.js").commit(e.app, owner, e.request.pathValue("id"), e.requestInfo().body));
}, $apis.requireAuth("staff"), $apis.bodyLimit(1024));
routerAdd("GET", "/api/megaworld/admin/schedule-imports/template", (e) => {
  require(__hooks + "/lib/security.js").staff(e);
  return require(__hooks + "/lib/schedule-imports.js").template(e);
}, $apis.requireAuth("staff"));
routerAdd("POST", "/api/megaworld/admin/schedule-imports/preview", (e) => {
  const owner = require(__hooks + "/lib/security.js").staff(e);
  e.response.header().set("Cache-Control", "no-store");
  return e.json(201, require(__hooks + "/lib/schedule-imports.js").preview(e.app, owner, e.requestInfo().body));
}, $apis.requireAuth("staff"), $apis.bodyLimit(3000000));
routerAdd("POST", "/api/megaworld/admin/schedule-imports/{id}/commit", (e) => {
  const owner = require(__hooks + "/lib/security.js").staff(e);
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/schedule-imports.js").commit(e.app, owner, e.request.pathValue("id"), e.requestInfo().body));
}, $apis.requireAuth("staff"), $apis.bodyLimit(1024));
