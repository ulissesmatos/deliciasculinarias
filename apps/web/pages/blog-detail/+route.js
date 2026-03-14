import { SUPPORTED_LANGS } from '@/lib/routes.js';

export default function route(pageContext) {
  const { urlPathname } = pageContext;
  const parts = urlPathname.split('/').filter(Boolean);

  if (parts.length !== 3) return false;

  const lang = parts[0];
  if (!SUPPORTED_LANGS.includes(lang)) return false;

  if (parts[1] === 'blog') {
    return { routeParams: { lang, slug: parts[2] } };
  }

  return false;
}
