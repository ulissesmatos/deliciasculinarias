import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';

// Module-level cache so all components share one fetch
let cache = null;
let pending = null;

export const useBlogCategories = () => {
  const [categories, setCategories] = useState(cache || []);

  useEffect(() => {
    if (cache) { setCategories(cache); return; }
    if (!pending) {
      pending = pb.collection('blog_categories')
        .getFullList({ sort: 'name_pt', $autoCancel: false })
        .then(items => { cache = items; return items; })
        .catch(() => { pending = null; return []; });
    }
    pending.then(items => setCategories(items));
  }, []);

  const getCategoryName = (slug, language) => {
    if (!slug) return '';
    const cat = categories.find(c => c.slug === slug);
    if (!cat) return slug;
    return cat[`name_${language}`] || cat.name_pt || slug;
  };

  return { categories, getCategoryName };
};
