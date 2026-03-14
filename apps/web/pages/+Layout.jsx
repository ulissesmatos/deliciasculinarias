import React, { useEffect } from 'react';
import { usePageContext as useVikePageContext } from 'vike-react/usePageContext';
import { PageContextProvider } from '@/lib/vikeRouter.jsx';
import { LanguageProvider, useLanguage } from '@/hooks/useLanguage.jsx';
import { AuthProvider } from '@/hooks/useAuth.jsx';
import { SUPPORTED_LANGS, DEFAULT_LANG } from '@/lib/routes.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Toaster } from '@/components/ui/toaster';
import '@/index.css';

function getLangFromUrl(pathname) {
  const segment = (pathname || '').split('/')[1];
  return SUPPORTED_LANGS.includes(segment) ? segment : DEFAULT_LANG;
}

function LanguageSync({ children }) {
  const pageContext = useVikePageContext();
  const { syncLanguageFromPath } = useLanguage();

  // Sync language whenever Vike navigates to a new page
  useEffect(() => {
    if (pageContext?.urlPathname) {
      syncLanguageFromPath(pageContext.urlPathname);
    }
  }, [pageContext?.urlPathname, syncLanguageFromPath]);

  return children;
}

export default function Layout({ children }) {
  const pageContext = useVikePageContext();
  const isAdmin = pageContext.urlPathname?.startsWith('/admin');
  const lang = pageContext.routeParams?.lang || getLangFromUrl(pageContext.urlPathname);

  return (
    <PageContextProvider pageContext={pageContext}>
      <AuthProvider>
        <LanguageProvider initialLang={lang}>
          <LanguageSync>
            {isAdmin ? (
              children
            ) : (
              <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-grow">
                  {children}
                </div>
                <Footer />
              </div>
            )}
            <Toaster />
          </LanguageSync>
        </LanguageProvider>
      </AuthProvider>
    </PageContextProvider>
  );
}
