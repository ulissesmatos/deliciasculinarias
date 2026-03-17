import { usePageContext } from 'vike-react/usePageContext';
import { translate } from '@/lib/translations.js';
import HreflangTags from '@/components/HreflangTags.jsx';

export default function Head() {
  const { routeParams } = usePageContext();
  const t = (key) => translate(routeParams?.lang || 'pt', key);

  return (
    <>
      <title>{t('about.title')} - {t('home.title')}</title>
      <meta name="description" content={t('about.desc')} />
      <HreflangTags routeName="about" />
    </>
  );
}
