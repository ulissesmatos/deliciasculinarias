/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Add featured_image_url to blog_articles
  const blog = app.findCollectionByNameOrId("blog_articles");
  if (!blog.fields.getByName("featured_image_url")) {
    blog.fields.add(new TextField({ name: "featured_image_url", required: false }));
    app.save(blog);
  }

  // Add featured_image_url to recipes
  const recipes = app.findCollectionByNameOrId("recipes");
  if (!recipes.fields.getByName("featured_image_url")) {
    recipes.fields.add(new TextField({ name: "featured_image_url", required: false }));
    app.save(recipes);
  }
}, (app) => {
  try {
    const blog = app.findCollectionByNameOrId("blog_articles");
    blog.fields.removeByName("featured_image_url");
    app.save(blog);
  } catch (e) {}
  try {
    const recipes = app.findCollectionByNameOrId("recipes");
    recipes.fields.removeByName("featured_image_url");
    app.save(recipes);
  } catch (e) {}
});
