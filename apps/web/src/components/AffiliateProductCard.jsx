
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage.jsx';

const AffiliateProductCard = ({ product }) => {
  const { t } = useLanguage();
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {product.image_url && (
        <div className="h-40 overflow-hidden">
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h4 className="font-bold text-gray-900 mb-2">{product.name}</h4>
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        {product.category && (
          <span className="inline-block px-2 py-1 bg-secondary/20 text-secondary text-xs rounded-full mb-3">
            {product.category}
          </span>
        )}
        <a
          href={product.affiliate_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-accent text-white py-2 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
        >
          {t('common.viewProduct')}
          <ExternalLink size={16} />
        </a>
      </div>
    </motion.div>
  );
};

export default AffiliateProductCard;
