/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const notes = app.findCollectionByNameOrId("workspace_notes");
  notes.fields.add(new NumberField({ name: "position", min: 0, onlyInt: true }));
  app.save(notes);
  const positions = {};
  for (const note of app.findRecordsByFilter("workspace_notes", "", "-updated,-created", 0, 0)) {
    const owner = note.getString("owner");
    positions[owner] = (positions[owner] || 0) + 1;
    note.set("position", positions[owner]);
    app.saveNoValidate(note);
  }
}, (app) => {
  const notes = app.findCollectionByNameOrId("workspace_notes");
  notes.fields.removeByName("position"); app.save(notes);
});
