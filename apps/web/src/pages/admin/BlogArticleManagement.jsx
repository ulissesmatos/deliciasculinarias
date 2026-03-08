
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import pb from '@/lib/pocketbaseClient.js';

const CATEGORY_LABELS = {
  sandwiches: 'Sandes', breads: 'Pães', sauces: 'Molhos',
  combinations: 'Combinações', techniques: 'Técnicas', special_ingredients: 'Ingredientes Especiais',
};

const BlogArticleManagement = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const records = await pb.collection('blog_articles').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setArticles(records);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({ 
        title: t('common.error'), 
        description: 'Failed to load articles. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tens a certeza que queres apagar este artigo?')) return;
    try {
      await pb.collection('blog_articles').delete(id, { $autoCancel: false });
      setArticles(prev => prev.filter(a => a.id !== id));
      toast({ title: t('common.success') });
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({ title: t('common.error'), description: 'Não foi possível apagar.', variant: 'destructive' });
    }
  };

  return (
    <>
      <Helmet><title>{t('admin.blog.title')} - Admin</title></Helmet>

      <div className="min-h-full bg-gray-50 py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('admin.blog.title')}</h1>
              <p className="text-gray-500 mt-1">{articles.length} artigo{articles.length !== 1 ? 's' : ''}</p>
            </div>
            <Button onClick={() => navigate('/admin/blog/new')} className="flex items-center gap-2">
              <Plus size={16} /> Novo Artigo
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />)}
            </div>
          ) : articles.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
              <p className="text-gray-500 text-lg mb-4">Ainda não há artigos.</p>
              <Button onClick={() => navigate('/admin/blog/new')}><Plus size={16} className="mr-2" /> Criar primeiro artigo</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map(article => {
                const imageUrl = article.featured_image_url
                  || (article.featured_image
                    ? pb.files.getURL(article, article.featured_image, { thumb: '80x80' })
                    : null);
                return (
                  <div key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 p-4 hover:border-primary/30 transition-colors">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {imageUrl
                        ? <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{article.title_pt || article.title_es || '(sem título)'}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {article.category && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
                            {CATEGORY_LABELS[article.category] || article.category}
                          </span>
                        )}
                        {article.description_pt && (
                          <span className="text-sm text-gray-400 truncate">{article.description_pt}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/blog/${article.id}/edit`)} className="flex items-center gap-1">
                        <Edit size={14} /> Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(article.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogArticleManagement;
