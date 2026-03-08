export const SUPPORTED_LANGS = ['pt', 'en', 'es'];
export const DEFAULT_LANG = 'pt';

// Translated slugs per language per page
export const ROUTE_SLUGS = {
  pt: {
    recipes:     'receitas',
    recipe:      'receita',
    about:       'sobre',
    contact:     'contato',
  },
  en: {
    recipes:     'recipes',
    recipe:      'recipe',
    about:       'about',
    contact:     'contact',
  },
  es: {
    recipes:     'recetas',
    recipe:      'receta',
    about:       'nosotros',
    contact:     'contacto',
  },
};

// Full route templates — blog slug stays "blog" in all languages
export const ROUTES = {
  pt: {
    home:        '/pt',
    recipes:     '/pt/receitas',
    recipe:      '/pt/receita/:slug',
    blog:        '/pt/blog',
    blogArticle: '/pt/blog/:slug',
    about:       '/pt/sobre',
    contact:     '/pt/contato',
  },
  en: {
    home:        '/en',
    recipes:     '/en/recipes',
    recipe:      '/en/recipe/:slug',
    blog:        '/en/blog',
    blogArticle: '/en/blog/:slug',
    about:       '/en/about',
    contact:     '/en/contact',
  },
  es: {
    home:        '/es',
    recipes:     '/es/recetas',
    recipe:      '/es/receta/:slug',
    blog:        '/es/blog',
    blogArticle: '/es/blog/:slug',
    about:       '/es/nosotros',
    contact:     '/es/contacto',
  },
};

/**
 * Generate a route path for a given language + route name + optional params.
 * e.g. route('pt', 'recipe', { id: 'abc123' }) → '/pt/receita/abc123'
 */
export const route = (lang, name, params = {}) => {
  const template = ROUTES[lang]?.[name];
  if (!template) return `/${lang}`;
  return Object.entries(params).reduce(
    (path, [key, val]) => path.replace(`:${key}`, val),
    template
  );
};

/**
 * Detect the user's preferred language from the browser.
 * Falls back to DEFAULT_LANG if not supported.
 */
export const detectBrowserLang = () => {
  const nav =
    (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || '';
  const code = nav.split('-')[0].toLowerCase();
  return SUPPORTED_LANGS.includes(code) ? code : DEFAULT_LANG;
};

/**
 * Given a pathname, return { lang, routeName, params } or null if unrecognised.
 * Used by the language switcher to keep the user on the same "page" after switching.
 */
export const parseRoute = (pathname) => {
  const parts = pathname.split('/').filter(Boolean); // ['pt', 'receita', 'abc123']
  const lang = parts[0];
  if (!SUPPORTED_LANGS.includes(lang)) return null;

  for (const [name, template] of Object.entries(ROUTES[lang])) {
    const match = matchTemplate(template, pathname);
    if (match !== null) return { lang, routeName: name, params: match };
  }
  return { lang, routeName: 'home', params: {} };
};

function matchTemplate(template, pathname) {
  const tParts = template.split('/');
  const pParts = pathname.split('/');
  if (tParts.length !== pParts.length) return null;
  const params = {};
  for (let i = 0; i < tParts.length; i++) {
    if (tParts[i].startsWith(':')) {
      params[tParts[i].slice(1)] = pParts[i];
    } else if (tParts[i] !== pParts[i]) {
      return null;
    }
  }
  return params;
}
