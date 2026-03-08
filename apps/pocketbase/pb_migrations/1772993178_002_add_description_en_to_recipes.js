/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("recipes");

  const existing = collection.fields.getByName("description_en");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("description_en"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "description_en",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("recipes");
  collection.fields.removeByName("description_en");
  return app.save(collection);
})
