
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import pb from '@/lib/pocketbaseClient.js';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    affiliate_link: '',
    category: 'Kitchen Tools',
    recipe_id: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const records = await pb.collection('affiliate_products').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setProducts(records);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({ 
        title: t('common.error'), 
        description: 'Failed to load products. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        description: product.description || '',
        affiliate_link: product.affiliate_link,
        category: product.category || 'Kitchen Tools',
        recipe_id: product.recipe_id || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        affiliate_link: '',
        category: 'Kitchen Tools',
        recipe_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('common.confirmDelete'))) {
      try {
        await pb.collection('affiliate_products').delete(id, { $autoCancel: false });
        setProducts(products.filter(p => p.id !== id));
        toast({ title: t('common.success') });
      } catch (error) {
        console.error('Error deleting product:', error);
        toast({ 
          title: t('common.error'), 
          description: 'Failed to delete product.', 
          variant: 'destructive' 
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await pb.collection('affiliate_products').update(editingId, formData, { $autoCancel: false });
      } else {
        await pb.collection('affiliate_products').create(formData, { $autoCancel: false });
      }
      toast({ title: t('common.success') });
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ 
        title: t('common.error'), 
        description: 'Failed to save product.', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('admin.products.title')} - Admin</title>
      </Helmet>
      <div className="min-h-full bg-cream py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.products.title')}</h1>
            <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
              <Plus size={16} />
              {t('admin.products.createNew')}
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 font-semibold text-gray-600">{t('admin.products.name')}</th>
                    <th className="p-4 font-semibold text-gray-600">{t('admin.products.category')}</th>
                    <th className="p-4 font-semibold text-gray-600">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" className="p-4 text-center">{t('common.loading')}</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan="3" className="p-4 text-center text-gray-500">No products found.</td></tr>
                  ) : products.map(product => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{product.name}</td>
                      <td className="p-4 text-gray-600">{product.category}</td>
                      <td className="p-4 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(product)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.products.formTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>{t('admin.products.name')}</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <Label>{t('admin.products.desc')}</Label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                rows={3}
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
            </div>
            <div>
              <Label>{t('admin.products.link')}</Label>
              <Input type="url" required value={formData.affiliate_link} onChange={e => setFormData({...formData, affiliate_link: e.target.value})} />
            </div>
            <div>
              <Label>{t('admin.products.category')}</Label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="Kitchen Tools">Kitchen Tools</option>
                <option value="Ingredients">Ingredients</option>
                <option value="Cookware">Cookware</option>
                <option value="Appliances">Appliances</option>
              </select>
            </div>
            <div>
              <Label>{t('admin.products.recipeId')}</Label>
              <Input value={formData.recipe_id} onChange={e => setFormData({...formData, recipe_id: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit">{t('common.save')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductManagement;
