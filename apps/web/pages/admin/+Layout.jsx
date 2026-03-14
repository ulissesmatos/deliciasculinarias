import React from 'react';
import { PageContextProvider } from '@/lib/vikeRouter.jsx';
import { usePageContext as useVikePageContext } from 'vike-react/usePageContext';
import { AuthProvider } from '@/hooks/useAuth.jsx';
import { LanguageProvider } from '@/hooks/useLanguage.jsx';
import { Toaster } from '@/components/ui/toaster';
import '@/index.css';

export default function Layout({ children }) {
  const pageContext = useVikePageContext();

  return (
    <PageContextProvider pageContext={pageContext}>
      <AuthProvider>
        <LanguageProvider>
          {children}
          <Toaster />
        </LanguageProvider>
      </AuthProvider>
    </PageContextProvider>
  );
}
