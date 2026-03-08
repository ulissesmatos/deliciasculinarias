/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("newsletter_subscribers");

  const existing = collection.fields.getByName("subscribed_date");
  if (existing) {
    if (existing.type === "autodate") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("subscribed_date"); // exists with wrong type, remove first
  }

  collection.fields.add(new AutodateField({
    name: "subscribed_date",
    onCreate: true,
    onUpdate: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("newsletter_subscribers");
  collection.fields.removeByName("subscribed_date");
  return app.save(collection);
})
