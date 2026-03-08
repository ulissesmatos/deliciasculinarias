/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("blog_categories");

  // Add i18n name fields
  for (const lang of ['pt', 'en', 'es']) {
    const fieldName = `name_${lang}`;
    if (!collection.fields.getByName(fieldName)) {
      collection.fields.add(new TextField({
        name: fieldName,
        required: lang === 'pt',
      }));
    }
  }

  // Remove the old single-language name field
  collection.fields.removeByName('name');

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("blog_categories");

  // Restore old name field
  if (!collection.fields.getByName('name')) {
    collection.fields.add(new TextField({ name: 'name', required: true, presentable: true }));
  }

  // Remove i18n fields
  for (const lang of ['pt', 'en', 'es']) {
    collection.fields.removeByName(`name_${lang}`);
  }

  app.save(collection);
});
