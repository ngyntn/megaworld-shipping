/// <reference path="../pb_data/types.d.ts" />
// Notes get a fixed type ("Báo giá", "Khách", ...) instead of a free color, and autosave may store a note without a title.
const KINDS = ["quote", "customer", "schedule", "reminder", "other"];
const TO_KIND = { yellow: "reminder", blue: "customer", green: "quote" };
const TO_COLOR = { reminder: "yellow", customer: "blue", quote: "green" };

migrate((app) => {
  let notes = app.findCollectionByNameOrId("workspace_notes");
  notes.fields.add(new SelectField({ name: "kind", required: true, maxSelect: 1, values: KINDS }));
  notes.fields.getByName("title").required = false;
  app.save(notes);
  for (const record of app.findAllRecords("workspace_notes")) {
    record.set("kind", TO_KIND[record.getString("color")] || "other");
    app.saveNoValidate(record);
  }
  notes = app.findCollectionByNameOrId("workspace_notes");
  notes.fields.removeByName("color");
  app.save(notes);
}, (app) => {
  let notes = app.findCollectionByNameOrId("workspace_notes");
  notes.fields.add(new SelectField({ name: "color", required: true, maxSelect: 1, values: ["yellow", "blue", "green"] }));
  app.save(notes);
  for (const record of app.findAllRecords("workspace_notes")) {
    record.set("color", TO_COLOR[record.getString("kind")] || "yellow");
    if (!record.getString("title")) record.set("title", "Ghi chú");
    app.saveNoValidate(record);
  }
  notes = app.findCollectionByNameOrId("workspace_notes");
  notes.fields.removeByName("kind");
  notes.fields.getByName("title").required = true;
  app.save(notes);
});
