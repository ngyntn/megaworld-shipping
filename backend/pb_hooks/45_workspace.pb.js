routerAdd("POST", "/api/megaworld/admin/workspace/notes/reorder", (e) => {
  const owner = require(__hooks + "/lib/security.js").staff(e);
  const v = require(__hooks + "/lib/validation.js");
  const body = e.requestInfo().body;
  v.keys(body, ["id", "target_id"]);
  const id = v.id(body.id, "id");
  const target = v.id(body.target_id, "target_id");
  e.app.runInTransaction((tx) => {
    const notes = Array.from(tx.findRecordsByFilter("workspace_notes", "owner = {:owner}", "position,-created,id", 0, 0, { owner }));
    const from = notes.findIndex(note => note.id === id);
    const to = notes.findIndex(note => note.id === target);
    if (from < 0 || to < 0) throw new NotFoundError("Note not found.");
    if (from === to) return;
    const moved = notes.splice(from, 1)[0];
    notes.splice(to, 0, moved);
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].getInt("position") === i + 1) continue;
      notes[i].set("position", i + 1);
      tx.save(notes[i]);
    }
  });
  e.response.header().set("Cache-Control", "no-store");
  return e.json(200, { success: true });
}, $apis.requireAuth("staff"), $apis.bodyLimit(1024));
