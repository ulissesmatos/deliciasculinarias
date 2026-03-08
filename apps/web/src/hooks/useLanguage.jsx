
import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '@/lib/translations.js';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('deliciasLanguage');
    return saved || 'es';
  });

  useEffect(() => {
    localStorage.setItem('deliciasLanguage', language);
  }, [language]);

  const t = (path) => {
    const keys = path.split('.');
    let current = translations[language];
    
    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation key not found: ${path} for language: ${language}`);
        return path;
      }
      current = current[key];
    }
    
    return current;
  };

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
