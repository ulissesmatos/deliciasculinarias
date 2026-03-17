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
import { usePageContext } from 'vike-react/usePageContext';
import { SUPPORTED_LANGS, DEFAULT_LANG, route } from '@/lib/routes.js';

const LOCALE_MAP = { pt: 'pt-BR', en: 'en-US', es: 'es' };
const ORIGIN = 'https://deliciasculinarias.shop';

/**
 * Renders hreflang <link> tags AND a <link rel="canonical"> for the current page.
 * Works both inside Vike +Head.jsx (renders into <head>) and standalone.
 *
 * The canonical tells Google "this is the authoritative URL for this content".
 * The hreflang tags tell Google "these are the same content in different languages".
 * Together they prevent Google from indexing each language version as a separate page.
 */
const HreflangTags = ({ routeName, params = {}, getParams }) => {
  const { routeParams } = usePageContext();
  const currentLang = routeParams?.lang || DEFAULT_LANG;
  const resolveParams = (lang) => getParams ? getParams(lang) : params;
  const canonicalHref = `${ORIGIN}${route(currentLang, routeName, resolveParams(currentLang))}`;

  return (
    <>
      {/* Canonical: tells Google which URL to index for this page */}
      <link rel="canonical" href={canonicalHref} />
      {/* hreflang: tells Google the other language versions of this same content */}
      {SUPPORTED_LANGS.map((lang) => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={LOCALE_MAP[lang]}
          href={`${ORIGIN}${route(lang, routeName, resolveParams(lang))}`}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${ORIGIN}${route(DEFAULT_LANG, routeName, resolveParams(DEFAULT_LANG))}`}
      />
    </>
  );
};

export default HreflangTags;
