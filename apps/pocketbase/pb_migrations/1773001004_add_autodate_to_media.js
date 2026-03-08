/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const col = app.findCollectionByNameOrId("media");

  if (!col.fields.getByName("created")) {
    col.fields.add(new AutodateField({
      name: "created",
      onCreate: true,
      onUpdate: false,
    }));
  }

  if (!col.fields.getByName("updated")) {
    col.fields.add(new AutodateField({
      name: "updated",
      onCreate: true,
      onUpdate: true,
    }));
  }

  app.save(col);
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("media");
    col.fields.removeByName("created");
    col.fields.removeByName("updated");
    app.save(col);
  } catch (e) {}
});
