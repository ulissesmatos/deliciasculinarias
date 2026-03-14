
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@/lib/vikeRouter.jsx';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import { getTranslation } from '@/lib/translations.js';
import { useBlogCategories } from '@/hooks/useBlogCategories.js';
import { route } from '@/lib/routes.js';
import CommentSection from '@/components/CommentSection.jsx';
import pb from '@/lib/pocketbaseClient.js';

const BlogDetailPage = ({ article: ssrArticle }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(ssrArticle || null);
  const [loading, setLoading] = useState(!ssrArticle);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { getCategoryName } = useBlogCategories();

  useEffect(() => {
    if (ssrArticle) return;
    let cancelled = false;

    const fetchArticle = async () => {
      setLoading(true);
      try {
        let record;
        try {
          record = await pb.collection('blog_articles').getFirstListItem(
            pb.filter(`slug_${language} = {:slug}`, { slug }),
            { requestKey: null }
          );
        } catch (err) {
          if (cancelled) return;
          if (err?.name === 'AbortError' || err?.isAbort) throw err;
          for (const fallbackLang of ['pt', 'en', 'es'].filter(l => l !== language)) {
            try {
              record = await pb.collection('blog_articles').getFirstListItem(
                pb.filter(`slug_${fallbackLang} = {:slug}`, { slug }),
                { requestKey: null }
              );
              break;
            } catch { /* continue */ }
          }
          if (!record) {
            if (/^[a-z0-9]{15}$/i.test(slug)) {
              record = await pb.collection('blog_articles').getOne(slug, { requestKey: null });
            } else {
              throw new Error('not found');
            }
          }
        }
        if (cancelled) return;
        setArticle(record);
      } catch (error) {
        if (cancelled || error?.name === 'AbortError' || error?.isAbort) return;
        console.error('Error fetching article:', error);
        toast({
          title: t('common.error'),
          description: 'Failed to load article',
          variant: 'destructive'
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchArticle();
    return () => { cancelled = true; };
  }, [slug, language]);

  // After loading, correct the URL to the canonical slug for the active language
  useEffect(() => {
    if (!article) return;
    const canonicalSlug = article[`slug_${language}`] || article.slug_pt || article.id;
    if (canonicalSlug && canonicalSlug !== slug) {
      navigate(route(language, 'blogArticle', { slug: canonicalSlug }), { replace: true });
    }
  }, [article, language]);

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
          <a href={route(language, 'blog')} className="text-secondary hover:underline mt-4 inline-block">
            {t('blog.backToList')}
          </a>
        </div>
      </div>
    );
  }

  const title = getTranslation(article, 'title', language);
  const description = getTranslation(article, 'description', language);
  const content = getTranslation(article, 'content', language);
  
  const imageUrl = article.featured_image_url
    || (article.featured_image
      ? pb.files.getURL(article, article.featured_image, { thumb: '800x600' })
      : 'https://images.unsplash.com/photo-1481070555726-e2fe8357725c?w=800');

  const articleId = article?.id || slug;

  // Schema.org Article structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description || '',
    image: imageUrl,
    author: { '@type': 'Organization', name: 'Delícias Culinárias' },
    publisher: {
      '@type': 'Organization',
      name: 'Delícias Culinárias',
    },
    datePublished: article.created,
    dateModified: article.updated || article.created,
  };

  return (
    <>
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
              <a href={route(language, 'blog')} className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
                <ArrowLeft size={20} className="mr-2" />
                {t('blog.backToList')}
              </a>
              
              {article.category && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-secondary text-white">
                    <Tag size={14} className="mr-2" />
                    {getCategoryName(article.category, language) || article.category}
                  </span>
                </div>
              )}
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
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
              
              <div
                className="prose prose-lg max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: content }}
              />
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
