/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Drop the broken media collection if it exists
  try {
    const old = app.findCollectionByNameOrId("media");
    app.delete(old);
  } catch (e) {}

  // Recreate with properly typed fields
  const collection = new Collection({
    "name": "media",
    "type": "base",
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
  });

  app.save(collection);

  // Reload after save so we can add fields
  const col = app.findCollectionByNameOrId("media");

  col.fields.add(new FileField({
    name: "file",
    required: true,
    maxSelect: 1,
    maxSize: 10485760,
    mimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
    thumbs: ["300x300", "600x400", "800x600"],
  }));

  col.fields.add(new TextField({
    name: "folder",
    required: false,
  }));

  col.fields.add(new TextField({
    name: "alt",
    required: false,
  }));

  col.fields.add(new AutodateField({
    name: "created",
    onCreate: true,
    onUpdate: false,
  }));

  col.fields.add(new AutodateField({
    name: "updated",
    onCreate: true,
    onUpdate: true,
  }));

  app.save(col);
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("media");
    app.delete(col);
  } catch (e) {}
});
