migrate((app) => {
  const schedules = app.findCollectionByNameOrId("schedules");
  schedules.fields.add(new NumberField({ name: "revision", min: 0, max: 2147483647, onlyInt: true }));
  app.save(schedules);
  const jobs = app.findCollectionByNameOrId("import_jobs");
  jobs.fields.add(new JSONField({ name: "payload", maxSize: 2000000 }));
  jobs.fields.add(new JSONField({ name: "results", maxSize: 2000000 }));
  jobs.fields.add(new NumberField({ name: "valid_rows", min: 0, max: 500, onlyInt: true }));
  app.save(jobs);
}, (app) => {
  const jobs = app.findCollectionByNameOrId("import_jobs");
  for (const name of ["payload", "results", "valid_rows"]) jobs.fields.removeByName(name);
  app.save(jobs);
  const schedules = app.findCollectionByNameOrId("schedules");
  schedules.fields.removeByName("revision"); app.save(schedules);
});
