import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import { route } from '@/lib/routes.js';

const NotFoundPage = () => {
  const { t, language } = useLanguage();

  return (
    <>
      <Helmet>
        <title>404 - {t('home.title')}</title>
      </Helmet>
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-8xl font-extrabold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Página não encontrada</h2>
          <p className="text-gray-600 mb-8">A página que procuras não existe ou foi movida.</p>
          <Link
            to={route(language, 'home')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 inline-block transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    </>
  );
};

export default NotFoundPage;
