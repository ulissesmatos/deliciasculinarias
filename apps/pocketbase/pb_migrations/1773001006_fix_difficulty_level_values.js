/// <reference path="../pb_data/types.d.ts" />
// Migration 1772993191 accidentally set difficulty_level.values to blog category
// slugs instead of ["Easy", "Medium", "Hard"]. This migration restores the correct values.
migrate((app) => {
  const col = app.findCollectionByNameOrId("recipes");
  const field = col.fields.getByName("difficulty_level");
  if (field) {
    field.values = ["Easy", "Medium", "Hard"];
    app.save(col);
  }
}, (app) => {});
