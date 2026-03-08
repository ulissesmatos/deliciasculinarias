
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Plus, Edit, Trash2, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import pb from '@/lib/pocketbaseClient.js';

const RecipeManagement = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => { fetchRecipes(); }, []);

  const fetchRecipes = async () => {
    try {
      const records = await pb.collection('recipes').getFullList({ sort: '-created', $autoCancel: false });
      setRecipes(records);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({ title: t('common.error'), description: 'Não foi possível carregar as receitas.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tens a certeza que queres apagar esta receita?')) return;
    try {
      await pb.collection('recipes').delete(id, { $autoCancel: false });
      setRecipes(prev => prev.filter(r => r.id !== id));
      toast({ title: t('common.success') });
    } catch (error) {
      toast({ title: t('common.error'), description: 'Não foi possível apagar.', variant: 'destructive' });
    }
  };

  const difficultyLabel = { Easy: 'Fácil', Medium: 'Médio', Hard: 'Difícil' };

  return (
    <>
      <Helmet><title>{t('admin.recipes.title')} - Admin</title></Helmet>

      <div className="min-h-full bg-gray-50 py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('admin.recipes.title')}</h1>
              <p className="text-gray-500 mt-1">{recipes.length} receita{recipes.length !== 1 ? 's' : ''}</p>
            </div>
            <Button onClick={() => navigate('/admin/recipes/new')} className="flex items-center gap-2">
              <Plus size={16} /> Nova Receita
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />)}
            </div>
          ) : recipes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
              <p className="text-gray-500 text-lg mb-4">Ainda não há receitas.</p>
              <Button onClick={() => navigate('/admin/recipes/new')}><Plus size={16} className="mr-2" /> Criar primeira receita</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recipes.map(recipe => {
                const imageUrl = recipe.featured_image
                  ? pb.files.getUrl(recipe, recipe.featured_image, { thumb: '80x80' })
                  : null;
                return (
                  <div key={recipe.id} className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 p-4 hover:border-primary/30 transition-colors">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {imageUrl
                        ? <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{recipe.title_pt || recipe.title_es || recipe.title || '(sem título)'}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {recipe.prep_time > 0 && <span className="flex items-center gap-1"><Clock size={12} /> {recipe.prep_time} min</span>}
                        {recipe.servings > 0 && <span className="flex items-center gap-1"><Users size={12} /> {recipe.servings} porções</span>}
                        {recipe.difficulty_level && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 font-medium">{difficultyLabel[recipe.difficulty_level] || recipe.difficulty_level}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/recipes/${recipe.id}/edit`)} className="flex items-center gap-1">
                        <Edit size={14} /> Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(recipe.id)}><Trash2 size={14} /></Button>
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

export default RecipeManagement;
