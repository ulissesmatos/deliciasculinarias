/**
 * Renders <link rel="alternate" hreflang="..."> tags in the document <head>.
 *
 * Usage:
 *   <HreflangTags routeName="recipe" params={{ id: recipe.id }} />
 *
 * Generates one tag per supported language + an x-default pointing to the
 * default language (Portuguese).
 */
import React from 'react';
import { Helmet } from 'react-helmet';
import { SUPPORTED_LANGS, DEFAULT_LANG, route } from '@/lib/routes.js';

const LOCALE_MAP = { pt: 'pt-BR', en: 'en-US', es: 'es' };

const HreflangTags = ({ routeName, params = {} }) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <Helmet>
      {SUPPORTED_LANGS.map((lang) => (
        <link
          key={lang}
          rel="alternate"
          hreflang={LOCALE_MAP[lang]}
          href={`${origin}${route(lang, routeName, params)}`}
        />
      ))}
      {/* x-default points to the default language */}
      <link
        rel="alternate"
        hreflang="x-default"
        href={`${origin}${route(DEFAULT_LANG, routeName, params)}`}
      />
    </Helmet>
  );
};

export default HreflangTags;
