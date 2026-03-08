
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { translations } from '@/lib/translations.js';
import { SUPPORTED_LANGS, detectBrowserLang, parseRoute, route } from '@/lib/routes.js';

const LanguageContext = createContext();

const getLangFromPath = (pathname) => {
  const segment = pathname.split('/')[1];
  return SUPPORTED_LANGS.includes(segment) ? segment : null;
};

export const LanguageProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [language, setLanguageState] = useState(() => {
    return (
      getLangFromPath(window.location.pathname) ||
      (() => {
        const saved = localStorage.getItem('deliciasLanguage');
        return SUPPORTED_LANGS.includes(saved) ? saved : detectBrowserLang();
      })()
    );
  });

  // Keep language in sync when the user navigates via browser back/forward
  useEffect(() => {
    const langFromPath = getLangFromPath(location.pathname);
    if (langFromPath && langFromPath !== language) {
      setLanguageState(langFromPath);
      localStorage.setItem('deliciasLanguage', langFromPath);
    }
  }, [location.pathname]);

  // Switch language: navigate to the equivalent page in the new language
  const setLanguage = useCallback(
    (newLang) => {
      if (!SUPPORTED_LANGS.includes(newLang) || newLang === language) return;
      localStorage.setItem('deliciasLanguage', newLang);
      const parsed = parseRoute(location.pathname);
      navigate(parsed ? route(newLang, parsed.routeName, parsed.params) : `/${newLang}`);
    },
    [language, location.pathname, navigate]
  );

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
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
