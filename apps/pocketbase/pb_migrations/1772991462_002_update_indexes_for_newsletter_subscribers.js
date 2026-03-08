/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("newsletter_subscribers");
  collection.indexes.push("CREATE UNIQUE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers (email)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("newsletter_subscribers");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_newsletter_subscribers_email"));
  return app.save(collection);
})
