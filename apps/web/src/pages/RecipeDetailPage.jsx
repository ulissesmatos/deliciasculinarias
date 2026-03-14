
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@/lib/vikeRouter.jsx';
import { Clock, Users, Share2, Facebook, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import { getTranslation } from '@/lib/translations.js';
import { route } from '@/lib/routes.js';
import IngredientChecklist from '@/components/IngredientChecklist.jsx';
import AffiliateProductCard from '@/components/AffiliateProductCard.jsx';
import CommentSection from '@/components/CommentSection.jsx';
import pb from '@/lib/pocketbaseClient.js';

const RecipeDetailPage = ({ recipe: ssrRecipe, affiliateProducts: ssrAffiliateProducts }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(ssrRecipe || null);
  const [affiliateProducts, setAffiliateProducts] = useState(ssrAffiliateProducts || []);
  const [loading, setLoading] = useState(!ssrRecipe);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (ssrRecipe) return;
    let cancelled = false;

    const fetchRecipe = async () => {
      setLoading(true);
      try {
        let record;
        try {
          record = await pb.collection('recipes').getFirstListItem(
            pb.filter(`slug_${language} = {:slug}`, { slug }),
            { requestKey: null }
          );
        } catch (err) {
          if (cancelled) return;
          if (err?.name === 'AbortError' || err?.isAbort) throw err;
          for (const fallbackLang of ['pt', 'en', 'es'].filter(l => l !== language)) {
            try {
              record = await pb.collection('recipes').getFirstListItem(
                pb.filter(`slug_${fallbackLang} = {:slug}`, { slug }),
                { requestKey: null }
              );
              break;
            } catch { /* continue */ }
          }
          if (!record) {
            if (/^[a-z0-9]{15}$/i.test(slug)) {
              record = await pb.collection('recipes').getOne(slug, { requestKey: null });
            } else {
              throw new Error('not found');
            }
          }
        }
        if (cancelled) return;
        setRecipe(record);
      } catch (error) {
        if (cancelled || error?.name === 'AbortError' || error?.isAbort) return;
        console.error('Error fetching recipe:', error);
        toast({
          title: t('common.error'),
          description: 'Failed to load recipe',
          variant: 'destructive'
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRecipe();
    return () => { cancelled = true; };
  }, [slug, language]);

  // After loading, correct the URL to the canonical slug for the active language
  useEffect(() => {
    if (!recipe) return;
    const canonicalSlug = recipe[`slug_${language}`] || recipe.slug_pt || recipe.id;
    if (canonicalSlug && canonicalSlug !== slug) {
      navigate(route(language, 'recipe', { slug: canonicalSlug }), { replace: true });
    }
  }, [recipe, language]);

  useEffect(() => {
    if (recipe?.id) fetchAffiliateProducts();
  }, [recipe?.id]);

  const fetchAffiliateProducts = async () => {
    try {
      const records = await pb.collection('affiliate_products').getFullList({
        filter: pb.filter('recipe_id = {:id}', { id: recipe.id }),
        $autoCancel: false
      });
      setAffiliateProducts(records);
    } catch (error) {
      console.error('Error fetching affiliate products:', error);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = (platform) => {
    const title = getTranslation(recipe, 'title', language) || 'Check out this recipe';
    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
        break;
      case 'pinterest':
        url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(title)}`;
        break;
      default:
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">{t('recipes.notFound')}</p>
        </div>
      </div>
    );
  }

  const title = getTranslation(recipe, 'title', language);
  const description = getTranslation(recipe, 'description', language);
  const ingredients = getTranslation(recipe, 'ingredients', language) || recipe.ingredients || [];
  const instructions = getTranslation(recipe, 'instructions', language) || recipe.instructions || [];

  const imageUrl = recipe.featured_image_url
    || (recipe.featured_image
      ? pb.files.getURL(recipe, recipe.featured_image, { thumb: '800x600' })
      : 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800');

  const recipeId = recipe?.id || slug;

  // Schema.org Recipe structured data for SEO
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
      <main className="min-h-screen bg-cream">
        <div className="relative h-96 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="container mx-auto">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-5xl font-bold mb-4"
              >
                {title}
              </motion.h1>
              <div className="flex flex-wrap items-center gap-4">
                {recipe.prep_time && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Clock size={20} />
                    <span>{recipe.prep_time} {t('common.min')}</span>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Users size={20} />
                    <span>{recipe.servings} {t('common.servings')}</span>
                  </div>
                )}
                {recipe.difficulty_level && (
                  <span className="px-4 py-2 rounded-full font-semibold bg-primary/90 text-white">
                    {t(`common.${recipe.difficulty_level.toLowerCase()}`) || recipe.difficulty_level}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {description && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('recipes.about')}</h2>
                  <p className="text-gray-700 leading-relaxed">{description}</p>
                </motion.div>
              )}

              {ingredients && ingredients.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <IngredientChecklist 
                    recipeId={recipe.id} 
                    ingredients={ingredients} 
                  />
                </motion.div>
              )}

              {instructions && instructions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('recipes.instructions')}</h2>
                  <ol className="space-y-4">
                    {instructions.map((instruction, index) => (
                      <li key={index} className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <p className="text-gray-700 leading-relaxed pt-1">
                          {typeof instruction === 'string' ? instruction : instruction.step || instruction.text}
                        </p>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CommentSection recipeId={recipe.id} />
              </motion.div>
            </div>

            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 sticky top-24"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Share2 size={20} className="text-primary" />
                  {t('recipes.share')}
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => handleShare('facebook')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Facebook size={18} className="mr-2" />
                    Facebook
                  </Button>
                  <Button
                    onClick={() => handleShare('twitter')}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    <Twitter size={18} className="mr-2" />
                    Twitter
                  </Button>
                  <Button
                    onClick={() => handleShare('pinterest')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Share2 size={18} className="mr-2" />
                    Pinterest
                  </Button>
                </div>
              </motion.div>

              {affiliateProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{t('recipes.recommended')}</h3>
                  <div className="space-y-4">
                    {affiliateProducts.map((product) => (
                      <AffiliateProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default RecipeDetailPage;
