/// <reference path="../pb_data/types.d.ts" />
/**
 * Adds optional SEO/Schema.org fields to the recipes collection:
 *   - cook_time    (number, minutes) — cookTime in JSON-LD
 *   - keywords     (JSON array)      — keywords in JSON-LD
 *   - cuisine      (text)            — recipeCuisine in JSON-LD
 *   - video_url    (text)            — video.contentUrl in JSON-LD
 *   - nutrition    (JSON object)     — nutrition in JSON-LD
 *   - gallery      (file, multiple)  — image[] in JSON-LD + gallery section
 */
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1857138539");

  // cook_time (integer, minutes)
  collection.fields.add(new Field({
    "hidden": false,
    "id": "number_cook_time",
    "name": "cook_time",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "number",
    "max": null,
    "min": null,
    "onlyInt": true
  }));

  // keywords (JSON array of strings)
  collection.fields.add(new Field({
    "hidden": false,
    "id": "json_keywords",
    "name": "keywords",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "json",
    "maxSize": 0
  }));

  // cuisine (text, e.g. "Mediterranean", "Italian")
  collection.fields.add(new Field({
    "hidden": false,
    "id": "text_cuisine",
    "name": "cuisine",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text",
    "autogeneratePattern": "",
    "max": 0,
    "min": 0,
    "pattern": ""
  }));

  // video_url (text, YouTube or direct URL)
  collection.fields.add(new Field({
    "hidden": false,
    "id": "text_video_url",
    "name": "video_url",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "url",
    "exceptDomains": null,
    "onlyDomains": null
  }));

  // nutrition (JSON object: { calories, protein, fat, carbohydrates, fiber, sugar, sodium })
  collection.fields.add(new Field({
    "hidden": false,
    "id": "json_nutrition",
    "name": "nutrition",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "json",
    "maxSize": 0
  }));

  // gallery (multiple images)
  collection.fields.add(new Field({
    "hidden": false,
    "id": "file_gallery",
    "name": "gallery",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "file",
    "maxSelect": 10,
    "maxSize": 20971520,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/webp"
    ],
    "thumbs": [
      "400x300",
      "800x600"
    ]
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1857138539");

  for (const name of ["cook_time", "keywords", "cuisine", "video_url", "nutrition", "gallery"]) {
    const field = collection.fields.getByName(name);
    if (field) collection.fields.remove(field);
  }

  return app.save(collection);
});
