
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { BookOpen, MessageCircle, Users, ShoppingBag, FileText, AlertTriangle, Loader2, Cpu } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import { useAuth } from '@/hooks/useAuth.jsx';
import pb from '@/lib/pocketbaseClient.js';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    recipes: 0,
    articles: 0,
    comments: 0,
    subscribers: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled([
          pb.collection('recipes').getList(1, 1, { $autoCancel: false }),
          pb.collection('blog_articles').getList(1, 1, { $autoCancel: false }),
          pb.collection('comments').getList(1, 1, { $autoCancel: false }),
          pb.collection('newsletter_subscribers').getList(1, 1, { $autoCancel: false })
        ]);
        
        const hasErrors = results.some(result => result.status === 'rejected');
        if (hasErrors) {
          setError('Failed to load some statistics. Partial data is displayed.');
          console.error('Some fetch operations failed:', results.filter(r => r.status === 'rejected'));
        }

        setStats({
          recipes: results[0].status === 'fulfilled' ? results[0].value.totalItems : 0,
          articles: results[1].status === 'fulfilled' ? results[1].value.totalItems : 0,
          comments: results[2].status === 'fulfilled' ? results[2].value.totalItems : 0,
          subscribers: results[3].status === 'fulfilled' ? results[3].value.totalItems : 0
        });
      } catch (err) {
        console.error('Critical error fetching stats:', err);
        setError('Failed to load statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <Helmet>
        <title>{t('admin.dashboard.title')} - Delícias Culinárias</title>
      </Helmet>
      <div className="min-h-full bg-gray-50 py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
            <p className="text-gray-600">{t('admin.dashboard.welcome')}, {user?.email}</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-0.5" size={20} />
              <div>
                <h3 className="text-red-800 font-medium">Warning</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12 mb-12">
              <Loader2 className="animate-spin text-primary" size={48} />
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <BookOpen className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t('admin.dashboard.totalRecipes')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recipes}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <FileText className="text-secondary" size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t('admin.dashboard.totalArticles')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.articles}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <MessageCircle className="text-accent" size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t('admin.dashboard.totalComments')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.comments}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t('admin.dashboard.totalSubscribers')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.subscribers}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-4 gap-6">
            <Link to="/admin/recipes" className="block">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-center">
                <BookOpen className="mx-auto text-primary mb-4" size={32} />
                <h3 className="text-lg font-bold text-gray-900">{t('admin.dashboard.manageRecipes')}</h3>
              </div>
            </Link>
            <Link to="/admin/blog" className="block">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-center">
                <FileText className="mx-auto text-secondary mb-4" size={32} />
                <h3 className="text-lg font-bold text-gray-900">{t('admin.dashboard.manageBlog')}</h3>
              </div>
            </Link>
            <Link to="/admin/products" className="block">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-center">
                <ShoppingBag className="mx-auto text-accent mb-4" size={32} />
                <h3 className="text-lg font-bold text-gray-900">{t('admin.dashboard.manageProducts')}</h3>
              </div>
            </Link>
            <Link to="/admin/comments" className="block">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-center">
                <MessageCircle className="mx-auto text-blue-600 mb-4" size={32} />
                <h3 className="text-lg font-bold text-gray-900">{t('admin.dashboard.manageComments')}</h3>
              </div>
            </Link>
          </div>

          {/* AI Settings Card */}
          <div className="mt-6">
            <Link to="/admin/ai-settings" className="block max-w-sm">
              <div className="bg-gradient-to-r from-primary/5 to-purple-50 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow flex items-center gap-4 border border-primary/10">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Cpu className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Configurar IA</h3>
                  <p className="text-sm text-gray-500">OpenAI & OpenRouter</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
