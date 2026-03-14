import { usePageContext } from 'vike-react/usePageContext';
import { translations } from '@/lib/translations.js';
import { SUPPORTED_LANGS, DEFAULT_LANG } from '@/lib/routes.js';

/**
 * Lightweight language hook for +Head components.
 * Vike renders Head via renderToStaticMarkup in a separate React tree
 * that doesn't include the app's LanguageProvider, so useLanguage() fails.
 * This hook derives the language directly from the URL in pageContext.
 */
export function useHeadLanguage() {
  const pageContext = usePageContext();
  const pathname = pageContext.urlPathname || '';
  const segment = pathname.split('/')[1];
  const language = SUPPORTED_LANGS.includes(segment) ? segment : DEFAULT_LANG;

  const t = (path) => {
    const keys = path.split('.');
    let current = translations[language];
    for (const key of keys) {
      if (!current || current[key] === undefined) return path;
      current = current[key];
    }
    return current;
  };

  return { t, language };
}
