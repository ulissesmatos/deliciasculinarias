import { SUPPORTED_LANGS, ROUTE_SLUGS } from '@/lib/routes.js';

export default function route(pageContext) {
  const { urlPathname } = pageContext;
  const parts = urlPathname.split('/').filter(Boolean);

  // Match /:lang (exactly — home page)
  if (parts.length === 1 && SUPPORTED_LANGS.includes(parts[0])) {
    return { routeParams: { lang: parts[0] } };
  }

  // Match / (root redirect)
  if (parts.length === 0) {
    return { routeParams: { lang: 'pt' } };
  }

  return false;
}
