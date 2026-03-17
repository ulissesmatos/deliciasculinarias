/**
 * postbuild-hreflang.js
 *
 * Injects <link rel="alternate" hreflang> + <link rel="canonical"> tags into
 * static HTML files inside dist/client/ after `vite build` completes.
 *
 * Two operations:
 *  1. For every known static route (home, recipes, blog, about, contact ×
 *     3 languages), generate dist/client/{path}/index.html from the SPA shell
 *     template with the correct hreflang block injected. This ensures
 *     Googlebot always receives correct tags even when the SSR server is cold.
 *
 *  2. Walk dist/client/ and augment any *additional* index.html files found
 *     (e.g. produced by Vike pre-rendering). Dynamic /:lang/recipe/:slug and
 *     /:lang/blog/:slug paths are handled with best-effort same-slug mapping.
 *
 * Run: node tools/postbuild-hreflang.js   (from apps/web/)
 */

import {
  existsSync, readdirSync, readFileSync, writeFileSync,
  mkdirSync, lstatSync,
} from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST      = join(__dirname, '../dist/client');
const ORIGIN    = 'https://deliciasculinarias.shop';

const LANGS     = ['pt', 'en', 'es'];
const DEFAULT   = 'pt';
const LOCALE    = { pt: 'pt-BR', en: 'en-US', es: 'es' };

// ── Route groups ──────────────────────────────────────────────────────────────
// Each object maps language code → the canonical URL path for that language.
// x-default always points to the DEFAULT language path.

const ROUTE_GROUPS = [
  // home
  { pt: '/pt',          en: '/en',          es: '/es'          },
  // recipe list
  { pt: '/pt/receitas', en: '/en/recipes',  es: '/es/recetas'  },
  // blog list
  { pt: '/pt/blog',     en: '/en/blog',     es: '/es/blog'     },
  // about
  { pt: '/pt/sobre',    en: '/en/about',    es: '/es/nosotros' },
  // contact
  { pt: '/pt/contato',  en: '/en/contact',  es: '/es/contacto' },
];

// Fast reverse-lookup: path → route group
const PATH_TO_GROUP = new Map();
for (const group of ROUTE_GROUPS) {
  for (const path of Object.values(group)) {
    PATH_TO_GROUP.set(path, group);
  }
}

// ── Dynamic route detection ───────────────────────────────────────────────────
// Maps language → localized prefix used in that language's recipe / blog URLs.
const RECIPE_PREFIX  = { pt: 'receita', en: 'recipe',  es: 'receta' };
const BLOG_PREFIX    = { pt: 'blog',    en: 'blog',    es: 'blog'   };

/**
 * Given a URL path (e.g. `/en/recipe/duck-rice`), return a group object
 * { pt, en, es } or null if the path is unrecognised.
 *
 * For dynamic routes the slug is assumed identical across languages (best-effort).
 * Static routes use the exact mappings above.
 */
function resolveGroup(urlPath) {
  if (PATH_TO_GROUP.has(urlPath)) return PATH_TO_GROUP.get(urlPath);

  const parts = urlPath.split('/').filter(Boolean);
  if (parts.length < 3) return null;

  const lang   = parts[0];
  const prefix = parts[1];
  const slug   = parts.slice(2).join('/');

  if (!LANGS.includes(lang) || !slug) return null;

  if (RECIPE_PREFIX[lang] === prefix) {
    return {
      pt: `/pt/receita/${slug}`,
      en: `/en/recipe/${slug}`,
      es: `/es/receta/${slug}`,
    };
  }

  if (BLOG_PREFIX[lang] === prefix) {
    return {
      pt: `/pt/blog/${slug}`,
      en: `/en/blog/${slug}`,
      es: `/es/blog/${slug}`,
    };
  }

  return null;
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

/**
 * Build the block of <link> tags to inject for `urlPath` given its `group`.
 */
function buildBlock(urlPath, group) {
  const lines = LANGS.map(
    lang => `  <link rel="alternate" hreflang="${LOCALE[lang]}" href="${ORIGIN}${group[lang]}" />`
  );
  lines.push(`  <link rel="alternate" hreflang="x-default" href="${ORIGIN}${group[DEFAULT]}" />`);
  lines.push(`  <link rel="canonical" href="${ORIGIN}${urlPath}" />`);
  return lines.join('\n');
}

/**
 * Strip existing canonical / hreflang tags, then insert the new block just
 * before </head>.
 */
function inject(html, block) {
  html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*\/?>/gi, '');
  html = html.replace(/<link[^>]+hreflang[^>]*\/?>/gi, '');
  return html.replace('</head>', `${block}\n</head>`);
}

function write(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
}

// ── Main ──────────────────────────────────────────────────────────────────────

if (!existsSync(DIST)) {
  console.error(`[postbuild-hreflang] ERROR: ${DIST} not found. Run vite build first.`);
  process.exit(1);
}

const template = readFileSync(join(DIST, 'index.html'), 'utf8');
let created = 0;
let augmented = 0;

// ── Step 1: generate static-route HTML files ──────────────────────────────────
console.log('[postbuild-hreflang] Generating static-route HTML files…\n');

for (const group of ROUTE_GROUPS) {
  for (const lang of LANGS) {
    const urlPath = group[lang];
    const block   = buildBlock(urlPath, group);
    const html    = inject(template, block);
    const outFile = join(DIST, urlPath + '/index.html');
    write(outFile, html);
    created++;
    console.log(`  created  ${urlPath}/index.html`);
  }
}

// ── Step 2: augment any additional index.html files (prerender compat) ────────
console.log('\n[postbuild-hreflang] Walking dist/client/ for pre-rendered files…\n');

// Track paths we already handled so the walker skips them
const handled = new Set([
  join(DIST, 'index.html'), // SPA shell — intentionally non-route
  ...ROUTE_GROUPS.flatMap(g => LANGS.map(l => join(DIST, g[l] + '/index.html'))),
]);

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (lstatSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (entry !== 'index.html') continue;
    if (handled.has(full)) continue;

    // Derive URL path from file system path
    const rel     = relative(DIST, full).replace(/\\/g, '/');       // e.g. "pt/receita/slug/index.html"
    const urlPath = '/' + rel.replace(/\/index\.html$/, '');        // e.g. "/pt/receita/slug"

    const group = resolveGroup(urlPath);
    if (!group) {
      console.log(`  skip     ${urlPath} (unrecognised route)`);
      continue;
    }

    const block = buildBlock(urlPath, group);
    const html  = inject(readFileSync(full, 'utf8'), block);
    writeFileSync(full, html, 'utf8');
    augmented++;
    console.log(`  augmented ${urlPath}/index.html`);
  }
}

walk(DIST);

console.log(`\n[postbuild-hreflang] Done — ${created} created, ${augmented} augmented.\n`);
