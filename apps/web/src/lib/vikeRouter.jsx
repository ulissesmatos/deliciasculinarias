/**
 * Compatibility layer: provides react-router-like hooks backed by Vike's page context.
 * This allows existing components (Header, Footer, pages) to keep working with
 * minimal changes — only the import path changes.
 */
import React, { createContext, useContext } from 'react';

const PageContext = createContext(null);

/**
 * Provider that stores the Vike page context for child components.
 * Used in +Layout.jsx to make pageContext available everywhere.
 */
export function PageContextProvider({ pageContext, children }) {
  return (
    <PageContext.Provider value={pageContext}>
      {children}
    </PageContext.Provider>
  );
}

/**
 * Access the full Vike page context.
 */
export function usePageContext() {
  const ctx = useContext(PageContext);
  if (!ctx) throw new Error('usePageContext must be used within PageContextProvider');
  return ctx;
}

/**
 * Drop-in replacement for react-router's useLocation().
 * Returns { pathname, search, hash }.
 */
export function useLocation() {
  const ctx = useContext(PageContext);
  if (!ctx) {
    // Fallback for SSR or outside provider
    return { pathname: '/', search: '', hash: '' };
  }
  const url = ctx.urlParsed || {};
  return {
    pathname: ctx.urlPathname || '/',
    search: url.searchOriginal || '',
    hash: url.hashOriginal || '',
  };
}

/**
 * Drop-in replacement for react-router's useParams().
 * Returns the route parameters extracted by +route.js.
 */
export function useParams() {
  const ctx = useContext(PageContext);
  return ctx?.routeParams || {};
}

/**
 * Drop-in replacement for react-router's useNavigate().
 * Returns a navigate function for client-side navigation.
 * On the server, returns a no-op.
 */
export function useNavigate() {
  if (typeof window === 'undefined') {
    // Server-side: return a no-op
    return () => {};
  }
  return async (to, options = {}) => {
    const { navigate } = await import('vike/client/router');
    await navigate(to, { overwriteLastHistoryEntry: options.replace });
  };
}

/**
 * Drop-in replacement for react-router's <Link>.
 * Renders a standard <a> tag — Vike automatically intercepts clicks
 * for client-side navigation (no full page reload).
 */
export function Link({ to, children, className, style, ...rest }) {
  return (
    <a href={to} className={className} style={style} {...rest}>
      {children}
    </a>
  );
}
