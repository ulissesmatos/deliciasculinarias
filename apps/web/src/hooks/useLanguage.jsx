
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { translations } from '@/lib/translations.js';
import { SUPPORTED_LANGS, detectBrowserLang, parseRoute, route, DEFAULT_LANG } from '@/lib/routes.js';

const LanguageContext = createContext();

const isServer = typeof window === 'undefined';

const getLangFromPath = (pathname) => {
  const segment = pathname.split('/')[1];
  return SUPPORTED_LANGS.includes(segment) ? segment : null;
};

export const LanguageProvider = ({ children, initialLang }) => {
  const [language, setLanguageState] = useState(() => {
    if (initialLang && SUPPORTED_LANGS.includes(initialLang)) {
      return initialLang;
    }
    if (isServer) {
      return DEFAULT_LANG;
    }
    return (
      getLangFromPath(window.location.pathname) ||
      (() => {
        const saved = localStorage.getItem('deliciasLanguage');
        return SUPPORTED_LANGS.includes(saved) ? saved : detectBrowserLang();
      })()
    );
  });

  // Keep language in sync when the URL changes (client-side navigation)
  useEffect(() => {
    if (isServer) return;
    const langFromPath = getLangFromPath(window.location.pathname);
    if (langFromPath && langFromPath !== language) {
      setLanguageState(langFromPath);
      localStorage.setItem('deliciasLanguage', langFromPath);
    }
  });

  // Keep <html lang> in sync with the active language
  useEffect(() => {
    if (isServer) return;
    document.documentElement.lang = language === 'pt' ? 'pt-BR' : language === 'en' ? 'en-US' : language;
  }, [language]);

  // Switch language: navigate to the equivalent page in the new language
  const setLanguage = useCallback(
    async (newLang) => {
      if (!SUPPORTED_LANGS.includes(newLang) || newLang === language) return;
      if (!isServer) {
        localStorage.setItem('deliciasLanguage', newLang);
        const parsed = parseRoute(window.location.pathname);
        const target = parsed ? route(newLang, parsed.routeName, parsed.params) : `/${newLang}`;
        const { navigate } = await import('vike/client/router');
        await navigate(target);
      }
    },
    [language]
  );

  // Update language from URL (called by Layout when pageContext changes)
  const syncLanguageFromPath = useCallback((pathname) => {
    const langFromPath = getLangFromPath(pathname);
    if (langFromPath && langFromPath !== language) {
      setLanguageState(langFromPath);
      if (!isServer) {
        localStorage.setItem('deliciasLanguage', langFromPath);
      }
    }
  }, [language]);

  const t = useCallback(
    (path) => {
      const keys = path.split('.');
      let current = translations[language];
      for (const key of keys) {
        if (!current || current[key] === undefined) {
          console.warn(`Translation key not found: ${path} for language: ${language}`);
          return path;
        }
        current = current[key];
      }
      return current;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, syncLanguageFromPath, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
