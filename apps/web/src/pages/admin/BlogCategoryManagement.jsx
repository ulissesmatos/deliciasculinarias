// @rewritten for i18n
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Plus, Pencil, Trash2, Check, X, Tags, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import pb from '@/lib/pocketbaseClient.js';
import { toSlug } from '@/lib/slugify.js';

const LANGS = [
  { code: 'pt', flag: '🇵🇹', label: 'Português', required: true },
  { code: 'en', flag: '🇬🇧', label: 'English',   required: false },
  { code: 'es', flag: '🇪🇸', label: 'Español',   required: false },
];

const emptyNames = () => ({ pt: '', en: '', es: '' });

const DEFAULT_CATEGORIES = [
  { name_pt: 'Sanduíches',              name_en: 'Sandwiches',          name_es: 'Sándwiches',              slug: 'sandwiches' },
  { name_pt: 'Pães',                   name_en: 'Breads',              name_es: 'Panes',                   slug: 'breads' },
  { name_pt: 'Molhos',                 name_en: 'Sauces',              name_es: 'Salsas',                  slug: 'sauces' },
  { name_pt: 'Combinações',            name_en: 'Combinations',        name_es: 'Combinaciones',           slug: 'combinations' },
  { name_pt: 'Técnicas',               name_en: 'Techniques',          name_es: 'Técnicas',                slug: 'techniques' },
  { name_pt: 'Ingredientes Especiais', name_en: 'Special Ingredients', name_es: 'Ingredientes Especiales', slug: 'special_ingredients' },
];

const BlogCategoryManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editNames, setEditNames] = useState(emptyNames());
  const [editSlug, setEditSlug] = useState('');
  const [newNames, setNewNames] = useState(emptyNames());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pb.collection('blog_categories').getList(1, 200, { sort: 'name_pt', $autoCancel: false });
      setCategories(res.items);
    } catch (err) {
      if (err?.response?.status === 404 || err?.status === 404) {
        setError('A coleção blog_categories não existe ainda. Reinicia o servidor PocketBase para aplicar as migrações.');
      } else {
        toast({ title: 'Erro ao carregar categorias', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newNames.pt.trim()) return;
    setSaving(true);
    try {
      await pb.collection('blog_categories').create({
        name_pt: newNames.pt.trim(),
        name_en: newNames.en.trim() || newNames.pt.trim(),
        name_es: newNames.es.trim() || newNames.pt.trim(),
        slug: toSlug(newNames.pt),
      }, { $autoCancel: false });
      setNewNames(emptyNames());
      await load();
      toast({ title: 'Categoria criada!' });
    } catch {
      toast({ title: 'Erro ao criar categoria', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditNames({ pt: cat.name_pt || '', en: cat.name_en || '', es: cat.name_es || '' });
    setEditSlug(cat.slug || '');
  };

  const handleUpdate = async (id) => {
    if (!editNames.pt.trim()) return;
    setSaving(true);
    try {
      await pb.collection('blog_categories').update(id, {
        name_pt: editNames.pt.trim(),
        name_en: editNames.en.trim() || editNames.pt.trim(),
        name_es: editNames.es.trim() || editNames.pt.trim(),
        slug: editSlug || toSlug(editNames.pt),
      }, { $autoCancel: false });
      setEditingId(null);
      await load();
      toast({ title: 'Categoria atualizada!' });
    } catch {
      toast({ title: 'Erro ao atualizar categoria', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, namePt) => {
    if (!window.confirm(`Eliminar a categoria "${namePt}"?\nOs artigos com esta categoria não serão eliminados.`)) return;
    try {
      await pb.collection('blog_categories').delete(id, { $autoCancel: false });
      await load();
      toast({ title: 'Categoria eliminada.' });
    } catch {
      toast({ title: 'Erro ao eliminar categoria', variant: 'destructive' });
    }
  };

  const handleSeedDefaults = async () => {
    setSaving(true);
    for (const cat of DEFAULT_CATEGORIES) {
      try {
        await pb.collection('blog_categories').create(cat, { $autoCancel: false });
      } catch { /* skip duplicates */ }
    }
    await load();
    setSaving(false);
    toast({ title: 'Categorias padrão adicionadas!' });
  };

  return (
    <>
      <Helmet><title>Categorias do Blog - Admin</title></Helmet>

      <div className="min-h-full bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center gap-3">
            <button onClick={() => navigate('/admin/blog')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <Tags size={20} className="text-primary" />
            <h1 className="font-bold text-gray-900 text-lg leading-none">Categorias do Blog</h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {error ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800 text-sm">
              <strong>Atenção:</strong> {error}
            </div>
          ) : (
            <>
              {/* Create new */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus size={16} className="text-primary" />
                  Nova Categoria
                </h2>
                <div className="space-y-3">
                  {LANGS.map(({ code, flag, label, required }) => (
                    <div key={code} className="flex items-center gap-3">
                      <div className="w-28 shrink-0 flex items-center gap-1.5">
                        <span>{flag}</span>
                        <span className="text-sm text-gray-600">{label}</span>
                        {required && <span className="text-red-500 text-xs">*</span>}
                      </div>
                      <input
                        type="text"
                        placeholder={`Nome em ${label}…`}
                        value={newNames[code]}
                        onChange={e => setNewNames(n => ({ ...n, [code]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  ))}
                  <div className="flex items-center gap-3">
                    <div className="w-28 shrink-0 text-sm text-gray-500">Slug</div>
                    <code className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                      {newNames.pt ? toSlug(newNames.pt) : 'gerado-automaticamente'}
                    </code>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleCreate}
                      disabled={saving || !newNames.pt.trim()}
                      className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">
                    {loading ? 'A carregar…' : `Categorias (${categories.length})`}
                  </h2>
                  {categories.length === 0 && !loading && (
                    <button onClick={handleSeedDefaults} disabled={saving} className="text-xs text-primary hover:underline disabled:opacity-50">
                      Adicionar categorias padrão
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="p-8 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    Nenhuma categoria. Adiciona uma acima ou usa as{' '}
                    <button className="text-primary hover:underline" onClick={handleSeedDefaults}>categorias padrão</button>.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {categories.map(cat => (
                      <li key={cat.id} className="px-6 py-4">
                        {editingId === cat.id ? (
                          /* ── Edit form ── */
                          <div className="space-y-2.5">
                            {LANGS.map(({ code, flag, label, required }) => (
                              <div key={code} className="flex items-center gap-3">
                                <div className="w-28 shrink-0 flex items-center gap-1.5">
                                  <span className="text-sm">{flag}</span>
                                  <span className="text-xs text-gray-500">{label}</span>
                                  {required && <span className="text-red-500 text-xs">*</span>}
                                </div>
                                <input
                                  type="text"
                                  value={editNames[code]}
                                  onChange={e => setEditNames(n => ({ ...n, [code]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter') handleUpdate(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                                  className="flex-1 px-3 py-1.5 border border-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                  autoFocus={code === 'pt'}
                                />
                              </div>
                            ))}
                            <div className="flex items-center gap-3">
                              <div className="w-28 shrink-0 text-xs text-gray-400">Slug</div>
                              <input
                                type="text"
                                value={editSlug}
                                onChange={e => setEditSlug(toSlug(e.target.value))}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/30"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={() => handleUpdate(cat.id)}
                                disabled={saving || !editNames.pt.trim()}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                              >
                                <Check size={14} /> Guardar
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                              >
                                <X size={14} /> Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ── View row ── */
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900">{cat.name_pt}</span>
                                {cat.name_en && cat.name_en !== cat.name_pt && (
                                  <span className="text-xs text-gray-500">🇬🇧 {cat.name_en}</span>
                                )}
                                {cat.name_es && cat.name_es !== cat.name_pt && (
                                  <span className="text-xs text-gray-500">🇪🇸 {cat.name_es}</span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                                {cat.slug}
                              </span>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => startEdit(cat)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                title="Editar"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(cat.id, cat.name_pt)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogCategoryManagement;
