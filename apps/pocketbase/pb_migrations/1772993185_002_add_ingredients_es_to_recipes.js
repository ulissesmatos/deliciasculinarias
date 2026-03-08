/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("recipes");

  const existing = collection.fields.getByName("ingredients_es");
  if (existing) {
    if (existing.type === "json") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("ingredients_es"); // exists with wrong type, remove first
  }

  collection.fields.add(new JSONField({
    name: "ingredients_es",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("recipes");
  collection.fields.removeByName("ingredients_es");
  return app.save(collection);
})
