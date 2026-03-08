/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("recipes");

  const existing = collection.fields.getByName("instructions_es");
  if (existing) {
    if (existing.type === "json") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("instructions_es"); // exists with wrong type, remove first
  }

  collection.fields.add(new JSONField({
    name: "instructions_es",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("recipes");
  collection.fields.removeByName("instructions_es");
  return app.save(collection);
})
