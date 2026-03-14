import { useData } from 'vike-react/useData';
import { usePageContext } from 'vike-react/usePageContext';
import { getTranslation, translate } from '@/lib/translations.js';
import HreflangTags from '@/components/HreflangTags.jsx';
import pb from '@/lib/pocketbaseClient.js';

export default function Head() {
  const { article } = useData();
  const { routeParams } = usePageContext();
  const language = routeParams?.lang || 'pt';
  const t = (key) => translate(language, key);

  if (!article) {
    return <title>{t('blog.notFound')} - {t('home.title')}</title>;
  }

  const title = getTranslation(article, 'title', language);
  const description = getTranslation(article, 'description', language);
  const imageUrl = article.featured_image_url
    || (article.featured_image
      ? pb.files.getURL(article, article.featured_image, { thumb: '800x600' })
      : 'https://images.unsplash.com/photo-1481070555726-e2fe8357725c?w=800');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description || '',
    image: imageUrl,
    author: { '@type': 'Organization', name: 'Delícias Culinárias' },
    publisher: { '@type': 'Organization', name: 'Delícias Culinárias' },
    datePublished: new Date(article.created).toISOString(),
    dateModified: new Date(article.updated || article.created).toISOString(),
  };

  return (
    <>
      <title>{`${title} - ${t('home.title')}`}</title>
      <meta name="description" content={description || title} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description || ''} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:type" content="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HreflangTags
        routeName="blogArticle"
        getParams={(lang) => ({ slug: article[`slug_${lang}`] || article.slug_pt })}
      />
    </>
  );
}
