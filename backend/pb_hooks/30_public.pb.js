/// <reference path="../pb_data/types.d.ts" />
routerAdd("GET", "/api/megaworld/storefronts/{slug}", (e) => {
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/rates-read.js").storefront(e.app, e.request.pathValue("slug")));
});

routerAdd("GET", "/api/megaworld/storefronts/{slug}/rates", (e) => {
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/rates-read.js").list(e.app, e.request.pathValue("slug"), e.requestInfo().query));
});

routerAdd("GET", "/api/megaworld/storefronts/{slug}/rates/{series}/history", (e) => {
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, require(__hooks + "/lib/rates-read.js").history(e.app, e.request.pathValue("slug"),
    e.request.pathValue("series"), e.requestInfo().query));
});
