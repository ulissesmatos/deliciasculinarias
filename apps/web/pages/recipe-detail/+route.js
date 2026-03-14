import { SUPPORTED_LANGS, ROUTE_SLUGS } from '@/lib/routes.js';

export default function route(pageContext) {
  const { urlPathname } = pageContext;
  const parts = urlPathname.split('/').filter(Boolean);

  if (parts.length !== 3) return false;

  const lang = parts[0];
  if (!SUPPORTED_LANGS.includes(lang)) return false;

  const prefix = parts[1];
  if (prefix === ROUTE_SLUGS[lang].recipe) {
    return { routeParams: { lang, slug: parts[2] } };
  }

  return false;
}
