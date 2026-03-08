
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import { getTranslation } from '@/lib/translations.js';
import pb from '@/lib/pocketbaseClient.js';

const RecipeCard = ({ recipe }) => {
  const { t, language } = useLanguage();
  const imageUrl = recipe.featured_image 
    ? pb.files.getUrl(recipe, recipe.featured_image, { thumb: '300x300' })
    : 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400';

  const title = getTranslation(recipe, 'title', language);
  const description = getTranslation(recipe, 'description', language);

  const getCategoryLabel = (level) => {
    if (!level) return '';
    return t(`common.categories.${level}`) || level;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300"
    >
      <Link to={`/recipe/${recipe.id}`}>
        <div className="relative h-48 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
          {recipe.difficulty_level && (
            <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold bg-primary/90 text-white backdrop-blur-sm">
              {getCategoryLabel(recipe.difficulty_level)}
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-primary transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex items-center justify-between text-sm text-gray-500">
            {recipe.prep_time && (
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{recipe.prep_time} {t('common.min')}</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span>{recipe.servings} {t('common.servings')}</span>
              </div>
            )}
          </div>
          <button className="mt-4 w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
            {t('common.viewRecipe')}
          </button>
        </div>
      </Link>
    </motion.div>
  );
};

export default RecipeCard;
