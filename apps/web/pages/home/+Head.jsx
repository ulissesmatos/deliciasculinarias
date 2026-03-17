import { usePageContext } from 'vike-react/usePageContext';
import { translate } from '@/lib/translations.js';
import HreflangTags from '@/components/HreflangTags.jsx';

export default function Head() {
  const { routeParams } = usePageContext();
  const language = routeParams?.lang || 'pt';
  const t = (key) => translate(language, key);
  const pageTitle = `${t('home.title')} - ${t('home.subtitle')}`;
  const desc = t('home.desc');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Delícias Culinárias',
    url: 'https://deliciasculinarias.shop',
    description: desc,
    inLanguage: language === 'pt' ? 'pt-BR' : language === 'en' ? 'en-US' : 'es',
    publisher: {
      '@type': 'Organization',
      name: 'Delícias Culinárias',
      url: 'https://deliciasculinarias.shop',
    },
  };

  return (
    <>
      {/* Preload the hero image so the browser fetches it before JS runs, cutting LCP */}
      <link
        rel="preload"
        as="image"
        imageSrcSet="
          https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=828&q=75&auto=format&fit=crop 828w,
          https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1280&q=75&auto=format&fit=crop 1280w,
          https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1920&q=75&auto=format&fit=crop 1920w
        "
        imageSizes="100vw"
        fetchPriority="high"
      />
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content="https://images.unsplash.com/photo-1528735602780-2552fd46c7af" />
      <meta property="og:type" content="website" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HreflangTags routeName="home" />
    </>
  );
}
