/// <reference path="../pb_data/types.d.ts" />

// Fix: recipes should be publicly readable by anonymous visitors.
// Only write operations (create, update, delete) require authentication.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("recipes");
  collection.listRule = "";  // public
  collection.viewRule = "";  // public
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("recipes");
  collection.listRule = "@request.auth.id != \"\"";
  collection.viewRule = "@request.auth.id != \"\"";
  return app.save(collection);
})
