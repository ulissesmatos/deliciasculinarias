
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import RecipeCard from '@/components/RecipeCard.jsx';
import HreflangTags from '@/components/HreflangTags.jsx';
import pb from '@/lib/pocketbaseClient.js';

const PAGE_SIZE = 12;

const RecipeListPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { t } = useLanguage();

  // Debounce the search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedDifficulty]);

  const fetchRecipes = useCallback(async (page, query, difficulty) => {
    setLoading(true);
    try {
      const filterParts = [];

      if (query) {
        filterParts.push(
          pb.filter(
            '(title ~ {:q} || title_pt ~ {:q} || title_en ~ {:q} || title_es ~ {:q} || description ~ {:q})',
            { q: query }
          )
        );
      }

      if (difficulty !== 'All') {
        filterParts.push(pb.filter('difficulty_level = {:d}', { d: difficulty }));
      }

      const result = await pb.collection('recipes').getList(page, PAGE_SIZE, {
        sort: '-created',
        filter: filterParts.join(' && '),
        $autoCancel: false,
      });

      setRecipes(result.items);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes(currentPage, debouncedSearch, selectedDifficulty);
  }, [currentPage, debouncedSearch, selectedDifficulty, fetchRecipes]);

  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  return (
    <>
      <HreflangTags routeName="recipes" />
      <Helmet>
        <title>{t('recipes.title')} - {t('home.title')}</title>
        <meta name="description" content={t('recipes.desc')} />
      </Helmet>

      <main className="min-h-screen bg-cream">
        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-center mb-4"
            >
              {t('recipes.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-center text-white/90 max-w-2xl mx-auto"
            >
              {t('recipes.desc')}
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
                  placeholder={t('recipes.searchPlaceholder')}
                  className="pl-10 bg-white"
                />
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {difficulties.map((difficulty) => (
                  <Button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(difficulty)}
                    variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                    className={selectedDifficulty === difficulty ? 'bg-primary hover:bg-primary/90' : ''}
                  >
                    {t(`common.${difficulty.toLowerCase()}`)}
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
            ) : recipes.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recipes.map((recipe, index) => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <RecipeCard recipe={recipe} />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-12">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft size={16} />
                      Anterior
                    </Button>

                    <span className="text-sm text-gray-600">
                      Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                      <span className="ml-2 text-gray-400">({totalItems} receitas)</span>
                    </span>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      Seguinte
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-gray-600 mb-4">{t('recipes.notFound')}</p>
                <p className="text-gray-500">{t('recipes.adjustSearch')}</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default RecipeListPage;
