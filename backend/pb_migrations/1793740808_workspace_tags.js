/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const auth = '@request.auth.collectionName = "staff" && @request.auth.active = true';
  const own = auth + ' && owner = @request.auth.id';
  const tags = new Collection({ name: "workspace_tags", type: "base",
    listRule: own, viewRule: own, deleteRule: own,
    createRule: auth + ' && @request.body.owner = @request.auth.id',
    updateRule: own + ' && @request.body.owner:changed = false',
    fields: [
      { name: "owner", type: "relation", collectionId: app.findCollectionByNameOrId("staff").id, required: true, maxSelect: 1, cascadeDelete: true },
      { name: "name", type: "text", required: true, max: 40 },
      { name: "color", type: "select", required: true, maxSelect: 1, values: ["blue", "sky", "teal", "green", "yellow", "orange", "rose", "purple", "lavender", "gray"] },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ], indexes: ["CREATE UNIQUE INDEX idx_workspace_tag_name ON workspace_tags (owner, name)"] });
  app.save(tags);
  const legacy = {
    customer: ["Khách hàng", "blue"], rate: ["Giá cước", "green"], quote: ["Báo giá", "green"],
    schedule: ["Lịch tàu", "orange"], reminder: ["Nhắc việc", "yellow"], other: ["Khác", "gray"],
  };
  const assigned = {};
  for (const [name, field] of [["workspace_events", "category"], ["workspace_notes", "kind"]]) {
    const collection = app.findCollectionByNameOrId(name);
    collection.fields.add(new RelationField({ name: "tag", collectionId: tags.id, maxSelect: 1, cascadeDelete: false }));
    app.save(collection);
    for (const record of app.findAllRecords(name)) {
      const owner = record.getString("owner");
      const kind = record.getString(field);
      const key = owner + ":" + kind;
      if (!assigned[key]) {
        const meta = legacy[kind] || legacy.other;
        const tag = new Record(tags);
        tag.set("owner", owner); tag.set("name", meta[0]); tag.set("color", meta[1]);
        app.save(tag); assigned[key] = tag.id;
      }
      record.set("tag", assigned[key]); app.save(record);
    }
  }
}, (app) => {
  for (const name of ["workspace_events", "workspace_notes"]) {
    const collection = app.findCollectionByNameOrId(name);
    collection.fields.removeByName("tag"); app.save(collection);
  }
  app.delete(app.findCollectionByNameOrId("workspace_tags"));
});
