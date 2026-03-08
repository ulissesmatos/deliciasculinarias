/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("recipes");

  const existing = collection.fields.getByName("ingredients_pt");
  if (existing) {
    if (existing.type === "json") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("ingredients_pt"); // exists with wrong type, remove first
  }

  collection.fields.add(new JSONField({
    name: "ingredients_pt",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("recipes");
  collection.fields.removeByName("ingredients_pt");
  return app.save(collection);
})
