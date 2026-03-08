/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("recipes");

  for (const lang of ['pt', 'en', 'es']) {
    const name = `slug_${lang}`;
    const existing = collection.fields.getByName(name);
    if (existing) {
      if (existing.type === "text") continue;
      collection.fields.removeByName(name);
    }
    collection.fields.add(new TextField({
      name,
      required: false,
    }));
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("recipes");
  for (const lang of ['pt', 'en', 'es']) {
    collection.fields.removeByName(`slug_${lang}`);
  }
  return app.save(collection);
});
