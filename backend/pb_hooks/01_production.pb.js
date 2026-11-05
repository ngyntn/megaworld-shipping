onBootstrap((e) => {
  e.next();
  if ($os.getenv("PB_ENV") === "production") require(__hooks + "/lib/production.js").configure(e.app);
});
