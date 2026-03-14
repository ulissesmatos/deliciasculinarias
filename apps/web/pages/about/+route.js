import { SUPPORTED_LANGS, ROUTE_SLUGS } from '@/lib/routes.js';

export default function route(pageContext) {
  const { urlPathname } = pageContext;
  const parts = urlPathname.split('/').filter(Boolean);

  if (parts.length !== 2) return false;

  const lang = parts[0];
  if (!SUPPORTED_LANGS.includes(lang)) return false;

  if (parts[1] === ROUTE_SLUGS[lang].about) {
    return { routeParams: { lang } };
  }

  return false;
}
