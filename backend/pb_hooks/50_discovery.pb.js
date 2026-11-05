routerAdd("GET", "/api/megaworld/storefronts/{slug}/catalog/{type}", (e) => {
  const shop = require(__hooks + "/lib/security.js").storefront(e.app, e.request.pathValue("slug"));
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/catalog.js").list(e.app, shop.getString("owner"), e.request.pathValue("type"), e.requestInfo().query));
});
routerAdd("GET", "/api/megaworld/storefronts/{slug}/compare", (e) => {
  const shop = require(__hooks + "/lib/security.js").storefront(e.app, e.request.pathValue("slug"));
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/rates-query.js").search(e.app, shop.getString("owner"), e.requestInfo().query, true));
});
routerAdd("GET", "/api/megaworld/storefronts/{slug}/schedules", (e) => {
  const shop = require(__hooks + "/lib/security.js").storefront(e.app, e.request.pathValue("slug"));
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/schedules.js").list(e.app, shop.getString("owner"), e.requestInfo().query, true));
});
routerAdd("GET", "/api/megaworld/storefronts/{slug}/schedules/export", (e) => {
  const shop = require(__hooks + "/lib/security.js").storefront(e.app, e.request.pathValue("slug"));
  return require(__hooks + "/lib/excel.js").schedules(e, shop.getString("owner"), e.requestInfo().query);
});
routerAdd("POST", "/api/megaworld/storefronts/{slug}/searches", (e) => {
  const shop = require(__hooks + "/lib/security.js").storefront(e.app, e.request.pathValue("slug"));
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/dashboard.js").search(e.app, shop.getString("owner"), e.requestInfo().body));
}, $apis.bodyLimit(1024));
