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
import { SUPPORTED_LANGS, DEFAULT_LANG, route } from '@/lib/routes.js';

const LOCALE_MAP = { pt: 'pt-BR', en: 'en-US', es: 'es' };
const ORIGIN = 'https://deliciasculinarias.shop';

/**
 * Renders hreflang <link> tags.
 * Works both inside Vike +Head.jsx (renders into <head>) and standalone.
 */
const HreflangTags = ({ routeName, params = {} }) => {
  return (
    <>
      {SUPPORTED_LANGS.map((lang) => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={LOCALE_MAP[lang]}
          href={`${ORIGIN}${route(lang, routeName, params)}`}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${ORIGIN}${route(DEFAULT_LANG, routeName, params)}`}
      />
    </>
  );
};

export default HreflangTags;
