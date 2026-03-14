import { useData } from 'vike-react/useData';
import { usePageContext } from 'vike-react/usePageContext';
import { getTranslation, translate } from '@/lib/translations.js';
import HreflangTags from '@/components/HreflangTags.jsx';
import pb from '@/lib/pocketbaseClient.js';

export default function Head() {
  const { recipe } = useData();
  const { routeParams } = usePageContext();
  const language = routeParams?.lang || 'pt';
  const t = (key) => translate(language, key);

  if (!recipe) {
    return <title>{t('recipes.notFound')} - {t('home.title')}</title>;
  }

  const title = getTranslation(recipe, 'title', language);
  const description = getTranslation(recipe, 'description', language);
  const ingredients = getTranslation(recipe, 'ingredients', language) || recipe.ingredients || [];
  const instructions = getTranslation(recipe, 'instructions', language) || recipe.instructions || [];

  const imageUrl = recipe.featured_image_url
    || (recipe.featured_image
      ? pb.files.getURL(recipe, recipe.featured_image, { thumb: '800x600' })
      : 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: title,
    description: description || '',
    image: imageUrl,
    author: { '@type': 'Organization', name: 'Delícias Culinárias' },
    datePublished: recipe.created,
    prepTime: recipe.prep_time ? `PT${recipe.prep_time}M` : undefined,
    recipeYield: recipe.servings ? `${recipe.servings}` : undefined,
    recipeCategory: 'Sandwich',
    recipeIngredient: ingredients,
    recipeInstructions: instructions.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: typeof step === 'string' ? step : step.step || step.text,
    })),
  };

  return (
    <>
      <title>{`${title} - ${t('home.title')}`}</title>
      <meta name="description" content={description || `Learn how to make ${title}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description || ''} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:type" content="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HreflangTags routeName="recipe" params={{ id: recipe.id }} />
    </>
  );
}
