/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("recipes");
  const field = collection.fields.getByName("difficulty_level");
  field.values = ["sandwiches", "breads", "sauces", "combinations", "techniques", "special_ingredients"];
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("recipes");
  const field = collection.fields.getByName("difficulty_level");
  field.values = ["Easy", "Medium", "Hard"];
  return app.save(collection);
})
