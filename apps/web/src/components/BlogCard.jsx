
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import { getTranslation } from '@/lib/translations.js';
import { route } from '@/lib/routes.js';
import { useBlogCategories } from '@/hooks/useBlogCategories.js';
import pb from '@/lib/pocketbaseClient.js';

// Append thumb params to PocketBase file URLs; add size params to bare Unsplash URLs
const optimizeImageUrl = (url, pbThumb = '640x0') => {
  if (!url) return null;
  if (url.includes('/api/files/')) {
    return url.includes('?') ? `${url}&thumb=${pbThumb}` : `${url}?thumb=${pbThumb}`;
  }
  if (url.includes('unsplash.com') && !url.includes('w=')) {
    return `${url}?w=640&q=75&auto=format&fit=crop`;
  }
  return url;
};

const BlogCard = ({ article }) => {
  const { t, language } = useLanguage();
  const { getCategoryName } = useBlogCategories();
  const imageUrl = article.featured_image_url
    ? optimizeImageUrl(article.featured_image_url)
    : (article.featured_image
      ? pb.files.getURL(article, article.featured_image, { thumb: '640x0' })
      : 'https://images.unsplash.com/photo-1481070555726-e2fe8357725c?w=640&q=75&auto=format&fit=crop');

  const title = getTranslation(article, 'title', language);
  const description = getTranslation(article, 'description', language);
  const slug = article[`slug_${language}`] || article.slug_pt || article.id;

  const getCategoryLabel = (cat) => {
    if (!cat) return '';
    return getCategoryName(cat, language) || cat;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 flex flex-col h-full"
    >
      <Link to={route(language, 'blogArticle', { slug })} className="flex flex-col h-full">
        <div className="relative h-48 overflow-hidden flex-shrink-0">
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
          {article.category && (
            <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/90 text-white backdrop-blur-sm">
              {getCategoryLabel(article.category)}
            </span>
          )}
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-primary transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
              {description}
            </p>
          )}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <span className="text-primary font-semibold hover:text-primary/80 transition-colors">
              {t('common.readArticle')} &rarr;
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default BlogCard;
