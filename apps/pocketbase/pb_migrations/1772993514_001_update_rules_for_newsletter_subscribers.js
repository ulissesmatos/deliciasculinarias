/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("newsletter_subscribers");
  collection.listRule = "@request.auth.id != \"\"";
  collection.viewRule = "@request.auth.id != \"\"";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("newsletter_subscribers");
  collection.listRule = null;
  collection.viewRule = null;
  return app.save(collection);
})
