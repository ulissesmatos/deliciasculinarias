/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("recipes");

  const existing = collection.fields.getByName("title_pt");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("title_pt"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "title_pt",
    required: true
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("recipes");
  collection.fields.removeByName("title_pt");
  return app.save(collection);
})
