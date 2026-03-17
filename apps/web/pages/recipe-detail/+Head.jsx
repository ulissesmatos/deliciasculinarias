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
    datePublished: new Date(recipe.created).toISOString(),
    prepTime: recipe.prep_time ? `PT${recipe.prep_time}M` : undefined,
    cookTime: recipe.cook_time ? `PT${recipe.cook_time}M` : undefined,
    totalTime: (recipe.prep_time || recipe.cook_time)
      ? `PT${(recipe.prep_time || 0) + (recipe.cook_time || 0)}M`
      : undefined,
    recipeYield: recipe.servings ? `${recipe.servings}` : undefined,
    recipeCuisine: recipe.cuisine || undefined,
    keywords: Array.isArray(recipe.keywords) && recipe.keywords.length
      ? recipe.keywords.join(', ')
      : undefined,
    recipeIngredient: ingredients,
    recipeInstructions: instructions.map((step, i) => {
      const text = typeof step === 'string' ? step : step.step || step.text || '';
      const name = text.split(/[.:,;]/)[0].trim().slice(0, 60);
      return { '@type': 'HowToStep', position: i + 1, name, text };
    }),
    nutrition: (() => {
      const n = recipe.nutrition;
      if (!n || typeof n !== 'object') return undefined;
      if (!n.calories && !n.protein) return undefined;
      return {
        '@type': 'NutritionInformation',
        ...(n.calories      && { calories:          n.calories }),
        ...(n.protein       && { proteinContent:    n.protein }),
        ...(n.fat           && { fatContent:        n.fat }),
        ...(n.carbohydrates && { carbohydrateContent: n.carbohydrates }),
        ...(n.fiber         && { fiberContent:      n.fiber }),
        ...(n.sugar         && { sugarContent:      n.sugar }),
        ...(n.sodium        && { sodiumContent:     n.sodium }),
      };
    })(),
    video: recipe.video_url ? {
      '@type': 'VideoObject',
      name: title,
      description: description || title,
      thumbnailUrl: imageUrl,
      contentUrl: recipe.video_url,
    } : undefined,
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
      <HreflangTags
        routeName="recipe"
        getParams={(lang) => ({ slug: recipe[`slug_${lang}`] || recipe.slug_pt })}
      />
    </>
  );
}
