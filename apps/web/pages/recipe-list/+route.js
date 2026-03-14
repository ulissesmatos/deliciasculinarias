import { SUPPORTED_LANGS, ROUTE_SLUGS } from '@/lib/routes.js';

export default function route(pageContext) {
  const { urlPathname } = pageContext;
  const parts = urlPathname.split('/').filter(Boolean);

  if (parts.length !== 2) return false;

  const lang = parts[0];
  if (!SUPPORTED_LANGS.includes(lang)) return false;

  const slug = parts[1];
  if (slug === ROUTE_SLUGS[lang].recipes) {
    return { routeParams: { lang } };
  }

  return false;
}
