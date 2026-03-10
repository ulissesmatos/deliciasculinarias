
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import { route } from '@/lib/routes.js';
import RecipeCard from '@/components/RecipeCard.jsx';
import BlogCard from '@/components/BlogCard.jsx';
import HreflangTags from '@/components/HreflangTags.jsx';
import pb from '@/lib/pocketbaseClient.js';

const HomePage = () => {
  const [featuredRecipes, setFeaturedRecipes] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipesRes, articlesRes] = await Promise.all([
          pb.collection('recipes').getList(1, 4, {
            sort: '-created',
            $autoCancel: false
          }),
          pb.collection('blog_articles').getList(1, 3, {
            sort: '-created',
            $autoCancel: false
          })
        ]);
        setFeaturedRecipes(recipesRes.items);
        setFeaturedArticles(articlesRes.items);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: t('common.error'),
        description: t('home.emailPlaceholder'),
        variant: 'destructive'
      });
      return;
    }

    setSubscribing(true);
    try {
      await pb.collection('newsletter_subscribers').create({
        email: email
      }, { $autoCancel: false });

      toast({
        title: t('common.success'),
        description: t('home.subscribe'),
      });
      setEmail('');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      <HreflangTags routeName="home" />
      <Helmet>
        <title>{t('home.title')} - {t('home.subtitle')}</title>
        <meta name="description" content={t('home.desc')} />
        <meta property="og:title" content={`${t('home.title')} - ${t('home.subtitle')}`} />
        <meta property="og:description" content={t('home.desc')} />
        <meta property="og:image" content="https://images.unsplash.com/photo-1528735602780-2552fd46c7af" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          'name': 'Delícias Culinárias',
          'url': 'https://deliciasculinarias.shop',
          'description': t('home.desc'),
          'inLanguage': language === 'pt' ? 'pt-BR' : language === 'en' ? 'en-US' : 'es',
          'publisher': {
            '@type': 'Organization',
            'name': 'Delícias Culinárias',
            'url': 'https://deliciasculinarias.shop'
          }
        })}</script>
      </Helmet>

      <main>
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* img instead of CSS background-image: browser can preload it and it counts as LCP element */}
          <img
            src="https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1280&q=75&auto=format&fit=crop"
            srcSet="
              https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=828&q=75&auto=format&fit=crop 828w,
              https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1280&q=75&auto=format&fit=crop 1280w,
              https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1920&q=75&auto=format&fit=crop 1920w
            "
            sizes="100vw"
            alt=""
            role="presentation"
            fetchpriority="high"
            loading="eager"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60"></div>

          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight"
            >
              {t('home.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-3xl mb-8 max-w-2xl mx-auto text-gray-200 font-light"
            >
              {t('home.subtitle')}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl mb-12 max-w-3xl mx-auto text-gray-300"
            >
              {t('home.desc')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to={route(language, 'recipes')}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6 w-full sm:w-auto">
                  {t('home.cta')}
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <Link to={route(language, 'blog')}>
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 text-lg px-8 py-6 w-full sm:w-auto">
                  {t('nav.blog')}
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-cream">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('home.featuredTitle')}</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {t('home.featuredDesc')}
              </p>
            </motion.div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg h-96 animate-pulse"></div>
                ))}
              </div>
            ) : featuredRecipes.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredRecipes.map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <RecipeCard recipe={recipe} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {t('home.noRecipes')}
              </div>
            )}

            <div className="text-center mt-12">
              <Link to={route(language, 'recipes')}>
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white">
                  {t('home.viewAll')}
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('home.featuredBlogTitle')}</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {t('home.featuredBlogDesc')}
              </p>
            </motion.div>

            {loading ? (
              <div className="grid md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-xl shadow-lg h-96 animate-pulse"></div>
                ))}
              </div>
            ) : featuredArticles.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-8">
                {featuredArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <BlogCard article={article} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {t('home.noArticles')}
              </div>
            )}

            <div className="text-center mt-12">
              <Link to={route(language, 'blog')}>
                <Button variant="outline" size="lg" className="border-secondary text-secondary hover:bg-secondary hover:text-white">
                  {t('home.viewAllBlog')}
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="text-4xl font-bold mb-4">{t('home.newsletterTitle')}</h2>
              <p className="text-lg mb-8 text-white/90">
                {t('home.newsletterDesc')}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('home.emailPlaceholder')}
                  className="flex-1 bg-white text-gray-900"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={subscribing}
                  className="bg-accent hover:bg-accent/90 text-white"
                >
                  {subscribing ? t('home.subscribing') : t('home.subscribe')}
                  <Mail className="ml-2" size={18} />
                </Button>
              </form>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
};

export default HomePage;
