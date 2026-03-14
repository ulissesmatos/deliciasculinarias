/**
 * Sitemap generator — Express handler for GET /sitemap.xml
 *
 * Fetches live recipes and blog articles from PocketBase and returns a
 * full multilingual sitemap with hreflang alternates.
 *
 * Used in development (primary) and as an SSR fallback in production
 * when the shell-generated static file isn't available yet.
 */

const DOMAIN = 'https://deliciasculinarias.shop';
const PB = process.env.PB_URL || 'http://127.0.0.1:8090';

const STATIC_PAGES = [
  // changefreq, priority, pt-path, en-path, es-path
  ['daily',   '1.0', '/pt',          '/en',          '/es'],
  ['weekly',  '0.9', '/pt/receitas', '/en/recipes',  '/es/recetas'],
  ['weekly',  '0.8', '/pt/blog',     '/en/blog',     '/es/blog'],
  ['monthly', '0.5', '/pt/sobre',    '/en/about',    '/es/nosotros'],
  ['monthly', '0.5', '/pt/contato',  '/en/contact',  '/es/contacto'],
];

function urlBlock(loc, lastmod, changefreq, priority, ptPath, enPath, esPath) {
  return `  <url>
    <loc>${DOMAIN}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="pt"        href="${DOMAIN}${ptPath}"/>
    <xhtml:link rel="alternate" hreflang="en"        href="${DOMAIN}${enPath}"/>
    <xhtml:link rel="alternate" hreflang="es"        href="${DOMAIN}${esPath}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${DOMAIN}${ptPath}"/>
  </url>`;
}

async function fetchCollection(collection) {
  const url = `${PB}/api/collections/${collection}/records?fields=slug_pt,slug_en,slug_es,updated&perPage=500&skipTotal=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function sitemapHandler(_req, res) {
  const today = new Date().toISOString().slice(0, 10);

  const [recipes, articles] = await Promise.all([
    fetchCollection('recipes'),
    fetchCollection('blog_articles'),
  ]);

  const blocks = [];

  // Static pages
  for (const [freq, pri, pt, en, es] of STATIC_PAGES) {
    blocks.push(urlBlock(pt, today, freq, pri, pt, en, es));
    blocks.push(urlBlock(en, today, freq, pri, pt, en, es));
    blocks.push(urlBlock(es, today, freq, pri, pt, en, es));
  }

  // Recipes
  for (const r of recipes) {
    const spt = r.slug_pt;
    const sen = r.slug_en || spt;
    const ses = r.slug_es || spt;
    const lm  = (r.updated || '').slice(0, 10) || today;
    if (!spt) continue;
    blocks.push(urlBlock(`/pt/receita/${spt}`, lm, 'monthly', '0.7', `/pt/receita/${spt}`, `/en/recipe/${sen}`, `/es/receta/${ses}`));
    blocks.push(urlBlock(`/en/recipe/${sen}`,  lm, 'monthly', '0.7', `/pt/receita/${spt}`, `/en/recipe/${sen}`, `/es/receta/${ses}`));
    blocks.push(urlBlock(`/es/receta/${ses}`,  lm, 'monthly', '0.7', `/pt/receita/${spt}`, `/en/recipe/${sen}`, `/es/receta/${ses}`));
  }

  // Blog articles
  for (const a of articles) {
    const spt = a.slug_pt;
    const sen = a.slug_en || spt;
    const ses = a.slug_es || spt;
    const lm  = (a.updated || '').slice(0, 10) || today;
    if (!spt) continue;
    blocks.push(urlBlock(`/pt/blog/${spt}`, lm, 'monthly', '0.6', `/pt/blog/${spt}`, `/en/blog/${sen}`, `/es/blog/${ses}`));
    blocks.push(urlBlock(`/en/blog/${sen}`, lm, 'monthly', '0.6', `/pt/blog/${spt}`, `/en/blog/${sen}`, `/es/blog/${ses}`));
    blocks.push(urlBlock(`/es/blog/${ses}`, lm, 'monthly', '0.6', `/pt/blog/${spt}`, `/en/blog/${sen}`, `/es/blog/${ses}`));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${blocks.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(xml);
}
