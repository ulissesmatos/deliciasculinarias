
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import { getTranslation } from '@/lib/translations.js';
import BlogCard from '@/components/BlogCard.jsx';
import { useBlogCategories } from '@/hooks/useBlogCategories.js';
import pb from '@/lib/pocketbaseClient.js';

const BlogPage = ({ initialArticles: ssrArticles }) => {
  const [articles, setArticles] = useState(ssrArticles || []);
  const [filteredArticles, setFilteredArticles] = useState(ssrArticles || []);
  const [loading, setLoading] = useState(!ssrArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { t, language } = useLanguage();
  const { categories: dynamicCategories, getCategoryName } = useBlogCategories();

  useEffect(() => {
    if (ssrArticles) return;
    fetchArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchQuery, selectedCategory, articles, language]);

  const fetchArticles = async () => {
    try {
      const records = await pb.collection('blog_articles').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setArticles(records);
      setFilteredArticles(records);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => {
        const title = getTranslation(article, 'title', language).toLowerCase();
        const desc = getTranslation(article, 'description', language).toLowerCase();
        return title.includes(query) || desc.includes(query);
      });
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    setFilteredArticles(filtered);
  };

  const categories = ['All', ...dynamicCategories.map(c => c.slug)];

  return (
    <>
      <main className="min-h-screen bg-cream">
        <section className="bg-secondary text-white py-16">
          <div className="container mx-auto px-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-center mb-4"
            >
              {t('blog.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-center text-white/90 max-w-2xl mx-auto"
            >
              {t('blog.desc')}
            </motion.p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="mb-8 space-y-4">
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('blog.searchPlaceholder')}
                  className="pl-10 bg-white"
                />
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    className={selectedCategory === cat ? 'bg-secondary hover:bg-secondary/90' : ''}
                  >
                    {cat === 'All' ? t('common.all') : getCategoryName(cat, language)}
                  </Button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg h-96 animate-pulse"></div>
                ))}
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <BlogCard article={article} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-gray-600 mb-4">{t('blog.notFound')}</p>
                <p className="text-gray-500">{t('recipes.adjustSearch')}</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default BlogPage;
