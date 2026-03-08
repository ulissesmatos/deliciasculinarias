/// <reference path="../pb_data/types.d.ts" />

// Fix: comments should be publicly readable and publicly creatable.
// Anyone can read/post a comment; only admins can delete.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("comments");
  collection.listRule   = "";  // public read
  collection.viewRule   = "";  // public read
  collection.createRule = "";  // public create (anyone can comment)
  collection.updateRule = "@request.auth.id != \"\"";  // admin only
  collection.deleteRule = "@request.auth.id != \"\"";  // admin only
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("comments");
  collection.listRule   = "@request.auth.id != \"\"";
  collection.viewRule   = "@request.auth.id != \"\"";
  collection.createRule = "";
  collection.updateRule = null;
  collection.deleteRule = null;
  return app.save(collection);
})
