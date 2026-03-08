
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import { getTranslation } from '@/lib/translations.js';
import CommentSection from '@/components/CommentSection.jsx';
import pb from '@/lib/pocketbaseClient.js';

const BlogDetailPage = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const record = await pb.collection('blog_articles').getOne(id, {
        $autoCancel: false
      });
      setArticle(record);
    } catch (error) {
      console.error('Error fetching article:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load article',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">{t('blog.notFound')}</p>
          <Link to="/blog" className="text-secondary hover:underline mt-4 inline-block">
            {t('blog.backToList')}
          </Link>
        </div>
      </div>
    );
  }

  const title = getTranslation(article, 'title', language);
  const description = getTranslation(article, 'description', language);
  const content = getTranslation(article, 'content', language);
  
  const imageUrl = article.featured_image 
    ? pb.files.getUrl(article, article.featured_image, { thumb: '800x600' })
    : 'https://images.unsplash.com/photo-1481070555726-e2fe8357725c?w=800';

  return (
    <>
      <Helmet>
        <title>{`${title} - ${t('home.title')}`}</title>
        <meta name="description" content={description || title} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description || ''} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:type" content="article" />
      </Helmet>

      <main className="min-h-screen bg-cream pb-16">
        <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="container mx-auto max-w-4xl">
              <Link to="/blog" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
                <ArrowLeft size={20} className="mr-2" />
                {t('blog.backToList')}
              </Link>
              
              {article.category && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-secondary text-white">
                    <Tag size={14} className="mr-2" />
                    {t(`common.categories.${article.category}`) || article.category}
                  </span>
                </div>
              )}
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
              >
                {title}
              </motion.h1>
              
              <div className="flex items-center text-white/80 text-sm">
                <Calendar size={16} className="mr-2" />
                {new Date(article.created).toLocaleDateString(language, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-8 md:p-12 mb-12"
            >
              {description && (
                <p className="text-xl text-gray-600 font-medium mb-8 leading-relaxed border-l-4 border-secondary pl-6">
                  {description}
                </p>
              )}
              
              <div className="prose prose-lg max-w-none text-gray-800">
                {content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-6 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CommentSection recipeId={article.id} />
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
};

export default BlogDetailPage;
