/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("blog_articles");

  // Remove the old select field
  collection.fields.removeByName("category");

  // Add a plain text field with the same name
  collection.fields.add(new TextField({
    id: "text_category_slug",
    name: "category",
    required: false,
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("blog_articles");

  collection.fields.removeByName("category");

  // Restore original select field
  const selectField = new SelectField({
    id: "select5109807963",
    name: "category",
    required: false,
    maxSelect: 1,
    values: ["sandwiches", "breads", "sauces", "combinations", "techniques", "special_ingredients"],
  });
  collection.fields.add(selectField);

  return app.save(collection);
});
