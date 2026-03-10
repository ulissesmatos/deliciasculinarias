import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Save, ImageIcon, Sparkles, Globe, Loader2, Plus, Pencil, Trash2, Check, X, Images, Link2, Upload } from 'lucide-react';
import MediaPickerModal from '@/components/admin/MediaPickerModal.jsx';
import RichTextEditor from '@/components/admin/RichTextEditor.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAI } from '@/hooks/useAI.js';
import { checkAIReady } from '@/lib/aiConfig.js';
import AIGenerateModal from '@/components/admin/AIGenerateModal.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { toSlug } from '@/lib/slugify.js';
import { convertToWebp } from '@/lib/convertToWebp.js';
import { useWebpConversion } from '@/hooks/useWebpConversion.js';

const LANGS = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

const DEFAULT_CATEGORIES = [
  { name_pt: 'Sanduíches',              name_en: 'Sandwiches',          name_es: 'Sándwiches',              slug: 'sandwiches' },
  { name_pt: 'Pães',                   name_en: 'Breads',              name_es: 'Panes',                   slug: 'breads' },
  { name_pt: 'Molhos',                 name_en: 'Sauces',              name_es: 'Salsas',                  slug: 'sauces' },
  { name_pt: 'Combinações',            name_en: 'Combinations',        name_es: 'Combinaciones',           slug: 'combinations' },
  { name_pt: 'Técnicas',               name_en: 'Techniques',          name_es: 'Técnicas',                slug: 'techniques' },
  { name_pt: 'Ingredientes Especiais', name_en: 'Special Ingredients', name_es: 'Ingredientes Especiales', slug: 'special_ingredients' },
];

const emptyForm = () => ({
  title_pt: '', title_en: '', title_es: '',
  slug_pt: '', slug_en: '', slug_es: '',
  description_pt: '', description_en: '', description_es: '',
  content_pt: '', content_en: '', content_es: '',
  category: 'sandwiches',
  featured_image: null,
});

const BlogArticleEditor = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeLang, setActiveLang] = useState('pt');
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [imageUrlOverride, setImageUrlOverride] = useState(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [convertWebp] = useWebpConversion();
  const [showAIModal, setShowAIModal] = useState(false);
  const fileInputRef = useRef(null);
  const { loading: aiLoading, operation: aiOperation, aiGenerateBlogArticle, aiTranslateBlogArticle } = useAI();
  const aiReady = checkAIReady().configured;

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatNames, setNewCatNames] = useState({ pt: '', en: '', es: '' });
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatNames, setEditingCatNames] = useState({ pt: '', en: '', es: '' });

  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      try {
        const r = await pb.collection('blog_articles').getOne(id, { $autoCancel: false });
        setForm({
          title_pt: r.title_pt || '',
          title_en: r.title_en || '',
          title_es: r.title_es || '',
          slug_pt: r.slug_pt || '',
          slug_en: r.slug_en || '',
          slug_es: r.slug_es || '',
          description_pt: r.description_pt || '',
          description_en: r.description_en || '',
          description_es: r.description_es || '',
          content_pt: r.content_pt || '',
          content_en: r.content_en || '',
          content_es: r.content_es || '',
          category: r.category || 'sandwiches',
          featured_image: null,
        });
        if (r.featured_image_url) {
          setExistingImage(r.featured_image_url);
          setImageUrlOverride(r.featured_image_url);
        } else if (r.featured_image) {
          setExistingImage(pb.files.getURL(r, r.featured_image, { thumb: '400x300' }));
        }
      } catch (err) {
        toast({ title: 'Erro', description: 'Não foi possível carregar o artigo.', variant: 'destructive' });
        navigate('/admin/blog');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  // Auto-generate slug when title changes (only if slug is still empty or was auto-generated)
  const setTitle = (lang, value) => {
    setForm(f => {
      const prevSlug = f[`slug_${lang}`];
      const prevTitle = f[`title_${lang}`];
      const wasAutoSlug = prevSlug === '' || prevSlug === toSlug(prevTitle);
      return {
        ...f,
        [`title_${lang}`]: value,
        [`slug_${lang}`]: wasAutoSlug ? toSlug(value) : prevSlug,
      };
    });
  };

  const loadCategories = async () => {
    setCatLoading(true);
    try {
      const res = await pb.collection('blog_categories').getList(1, 200, { sort: 'name_pt', $autoCancel: false });
      setCategories(res.items);
    } catch {
      setCategories(DEFAULT_CATEGORIES.map(c => ({ id: null, ...c })));
    } finally {
      setCatLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadCategories(); }, []);

  const handleAddCat = async () => {
    if (!newCatNames.pt.trim()) return;
    try {
      const created = await pb.collection('blog_categories').create({
        name_pt: newCatNames.pt.trim(),
        name_en: newCatNames.en.trim() || newCatNames.pt.trim(),
        name_es: newCatNames.es.trim() || newCatNames.pt.trim(),
        slug: toSlug(newCatNames.pt),
      }, { $autoCancel: false });
      setNewCatNames({ pt: '', en: '', es: '' });
      setShowNewCat(false);
      await loadCategories();
      set('category', created.slug);
      toast({ title: 'Categoria criada!' });
    } catch {
      toast({ title: 'Erro ao criar categoria', variant: 'destructive' });
    }
  };

  const handleDeleteCat = async (cat) => {
    if (!window.confirm(`Eliminar a categoria "${cat.name_pt || cat.name}"?`)) return;
    try {
      await pb.collection('blog_categories').delete(cat.id, { $autoCancel: false });
      if (form.category === cat.slug) set('category', '');
      await loadCategories();
    } catch {
      toast({ title: 'Erro ao eliminar categoria', variant: 'destructive' });
    }
  };

  const handleUpdateCat = async () => {
    if (!editingCatId || !editingCatNames.pt.trim()) return;
    const oldSlug = categories.find(c => c.id === editingCatId)?.slug;
    const newSlug = toSlug(editingCatNames.pt);
    try {
      await pb.collection('blog_categories').update(editingCatId, {
        name_pt: editingCatNames.pt.trim(),
        name_en: editingCatNames.en.trim() || editingCatNames.pt.trim(),
        name_es: editingCatNames.es.trim() || editingCatNames.pt.trim(),
        slug: newSlug,
      }, { $autoCancel: false });
      if (form.category === oldSlug) set('category', newSlug);
      setEditingCatId(null);
      await loadCategories();
    } catch {
      toast({ title: 'Erro ao atualizar categoria', variant: 'destructive' });
    }
  };

  const handleImageChange = async (e) => {
    const raw = e.target.files[0];
    if (!raw) return;
    const file = convertWebp ? await convertToWebp(raw) : raw;
    // Upload to media library first so it shows up in /admin/media
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'blog');
      const record = await pb.collection('media').create(fd, { requestKey: null });
      const url = pb.files.getURL(record, record.file);
      setImagePreview(url);
      setImageUrlOverride(url);
      set('featured_image', null);
    } catch (err) {
      // fallback: attach directly to the article
      set('featured_image', file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrlOverride(null);
      toast({ title: 'Aviso', description: 'Imagem não registada na biblioteca: ' + err.message, variant: 'destructive' });
    }
  };

  const handleMediaSelect = (url) => {
    setImagePreview(url);
    setImageUrlOverride(url);
    set('featured_image', null);
    setShowMediaPicker(false);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setExistingImage(null);
    setImageUrlOverride(null);
    set('featured_image', null);
  };

  /* ---------- AI handlers ---------- */
  const handleAIGenerate = async (prompt) => {
    const result = await aiGenerateBlogArticle(prompt, 'pt');
    if (!result) return;

    const hasContent = form.title_pt.trim();
    if (hasContent && !window.confirm('Isto irá substituir o conteúdo PT existente. Continuar?')) return;

    setForm(f => ({
      ...f,
      title_pt: result.title || f.title_pt,
      description_pt: result.description || f.description_pt,
      content_pt: result.content || f.content_pt,
      category: categories.some(c => c.slug === result.category) ? result.category : f.category,
    }));
    setActiveLang('pt');
    setShowAIModal(false);
    toast({ title: 'Artigo gerado!', description: 'Revise o conteúdo e faça ajustes se necessário.' });
  };

  const handleAITranslate = async (toLang) => {
    if (!form.title_pt.trim()) {
      toast({ title: 'Sem conteúdo PT', description: 'Preencha o artigo em Português primeiro.', variant: 'destructive' });
      return;
    }

    const hasContent = form[`title_${toLang}`].trim();
    if (hasContent && !window.confirm(`Isto irá substituir o conteúdo ${toLang.toUpperCase()} existente. Continuar?`)) return;

    const article = {
      title: form.title_pt,
      description: form.description_pt,
      content: form.content_pt,
    };

    const result = await aiTranslateBlogArticle(article, 'pt', toLang);
    if (!result) return;

    setForm(f => ({
      ...f,
      [`title_${toLang}`]: result.title || '',
      [`description_${toLang}`]: result.description || '',
      [`content_${toLang}`]: result.content || '',
    }));
    setActiveLang(toLang);
    toast({ title: `Traduzido para ${toLang.toUpperCase()}!` });
  };

  const handleAITranslateAll = async () => {
    if (!form.title_pt.trim()) {
      toast({ title: 'Sem conteúdo PT', description: 'Preencha o artigo em Português primeiro.', variant: 'destructive' });
      return;
    }
    await handleAITranslate('en');
    await handleAITranslate('es');
    toast({ title: 'Tradução completa!', description: 'EN e ES traduzidos a partir do PT.' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title_pt.trim()) {
      toast({ title: 'Campo obrigatório', description: 'O título em PT é obrigatório.', variant: 'destructive' });
      setActiveLang('pt');
      return;
    }

    setSaving(true);
    try {
      const titleEn = form.title_en.trim() || form.title_pt;
      const titleEs = form.title_es.trim() || form.title_pt;

      const data = new FormData();
      data.append('title_pt', form.title_pt);
      data.append('title_en', titleEn);
      data.append('title_es', titleEs);
      data.append('slug_pt', form.slug_pt || toSlug(form.title_pt));
      data.append('slug_en', form.slug_en || toSlug(titleEn));
      data.append('slug_es', form.slug_es || toSlug(titleEs));
      data.append('description_pt', form.description_pt);
      data.append('description_en', form.description_en || form.description_pt);
      data.append('description_es', form.description_es || form.description_pt);
      data.append('content_pt', form.content_pt);
      data.append('content_en', form.content_en || form.content_pt);
      data.append('content_es', form.content_es || form.content_pt);
      data.append('category', form.category);
      if (form.featured_image) {
        data.append('featured_image', form.featured_image);
        data.append('featured_image_url', '');
      } else if (imageUrlOverride) {
        data.append('featured_image_url', imageUrlOverride);
        data.append('featured_image', ''); // clear old file
      }

      if (isEditing) {
        await pb.collection('blog_articles').update(id, data, { $autoCancel: false });
      } else {
        await pb.collection('blog_articles').create(data, { $autoCancel: false });
      }

      toast({ title: 'Guardado com sucesso!' });
      navigate('/admin/blog');
    } catch (err) {
      console.error(err);
      const detail = err?.response?.data
        ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v.message}`).join(' | ')
        : err.message;
      toast({ title: 'Erro ao guardar', description: detail, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isEditing ? 'Editar Artigo' : 'Novo Artigo'} - Admin</title>
      </Helmet>

      <div className="min-h-full bg-gray-50">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/blog')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-none">
                  {isEditing ? 'Editar Artigo' : 'Novo Artigo'}
                </h1>
                {form.title_pt && (
                  <span className="text-sm text-gray-500">{form.title_pt}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {aiReady && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAIModal(true)}
                    disabled={aiLoading}
                    className="flex items-center gap-2 text-primary border-primary/30 hover:bg-primary/5"
                  >
                    <Sparkles size={16} />
                    <span className="hidden sm:inline">Gerar com IA</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAITranslateAll}
                    disabled={aiLoading || !form.title_pt.trim()}
                    className="flex items-center gap-2"
                  >
                    {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                    <span className="hidden sm:inline">{aiLoading ? aiOperation : 'Traduzir Tudo'}</span>
                  </Button>
                </>
              )}
              <Button type="button" variant="outline" onClick={() => navigate('/admin/blog')}>
                Cancelar
              </Button>
              <Button type="submit" form="blog-form" disabled={saving} className="flex items-center gap-2">
                <Save size={16} />
                {saving ? 'A guardar…' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>

        <form id="blog-form" onSubmit={handleSubmit} className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left — main content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Language tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                  {LANGS.map(l => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setActiveLang(l.code)}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${
                        activeLang === l.code
                          ? 'bg-primary text-white'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {l.label}
                      {l.code !== 'pt' && !form[`title_${l.code}`] && (
                        <span className="ml-1 text-xs opacity-70">(auto)</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-6 space-y-5">
                  {/* AI Translate button for non-PT languages */}
                  {activeLang !== 'pt' && aiReady && form.title_pt.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAITranslate(activeLang)}
                      disabled={aiLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          {aiOperation}
                        </>
                      ) : (
                        <>
                          <Globe size={15} />
                          Traduzir PT → {activeLang.toUpperCase()} com IA
                        </>
                      )}
                    </button>
                  )}

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      Título{activeLang === 'pt' && <span className="text-red-500 ml-1">*</span>}
                      <span className="ml-1 font-normal text-gray-400">({activeLang.toUpperCase()})</span>
                    </Label>
                    <Input
                      className="mt-1.5"
                      placeholder={activeLang !== 'pt' ? 'Deixar vazio para usar o PT' : 'Título do artigo…'}
                      value={form[`title_${activeLang}`]}
                      onChange={e => setTitle(activeLang, e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      Slug ({activeLang.toUpperCase()})
                      <span className="ml-1 font-normal text-gray-400 text-xs">URL personalizado</span>
                    </Label>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-xs text-gray-400 whitespace-nowrap">/{activeLang}/blog/</span>
                      <Input
                        placeholder="gerado-automaticamente-do-titulo"
                        value={form[`slug_${activeLang}`]}
                        onChange={e => set(`slug_${activeLang}`, toSlug(e.target.value))}
                        className="font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => set(`slug_${activeLang}`, toSlug(form[`title_${activeLang}`] || form.title_pt))}
                        className="shrink-0 text-xs px-2 py-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500 whitespace-nowrap"
                        title="Regenerar a partir do título"
                      >
                        ↺ Gerar
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      Resumo / Descrição
                      <span className="ml-1 font-normal text-gray-400">({activeLang.toUpperCase()})</span>
                    </Label>
                    <textarea
                      rows={2}
                      className="mt-1.5 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      placeholder="Aparece nos cartões e meta description SEO…"
                      value={form[`description_${activeLang}`]}
                      onChange={e => set(`description_${activeLang}`, e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Content editor */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">
                    Conteúdo
                    <span className="ml-1 text-sm font-normal text-gray-400">({activeLang.toUpperCase()})</span>
                  </h2>
                </div>

                <div className="p-4">
                  <RichTextEditor
                    value={form[`content_${activeLang}`]}
                    onChange={v => set(`content_${activeLang}`, v)}
                    placeholder="Comece a escrever o conteúdo do artigo…"
                  />
                </div>
              </div>
            </div>

            {/* Right — metadata */}
            <div className="space-y-6">

              {/* Image */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ImageIcon size={16} className="text-gray-400" />
                  Imagem Principal
                </h2>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 mb-3">
                  {(imagePreview || existingImage) ? (
                    <>
                      <img
                        src={imagePreview || existingImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white hover:bg-black/80 transition-colors"
                        title="Remover imagem"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon size={32} />
                      <span className="mt-2 text-sm">Nenhuma imagem selecionada</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={13} />
                    Upload
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setShowMediaPicker(true)}
                  >
                    <Images size={13} />
                    Biblioteca
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      const url = window.prompt('Introduz o URL da imagem:');
                      if (url?.trim()) handleMediaSelect(url.trim());
                    }}
                  >
                    <Link2 size={13} />
                    URL
                  </Button>
                </div>
              </div>

              {/* Category */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900">Categoria</h2>
                  <button
                    type="button"
                    onClick={() => { setShowNewCat(v => !v); setNewCatNames({ pt: '', en: '', es: '' }); setEditingCatId(null); }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      showNewCat ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'
                    }`}
                    title="Nova categoria"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {showNewCat && (
                  <div className="mb-3 bg-gray-50 rounded-lg p-2.5 space-y-1.5">
                    {[{ code: 'pt', flag: '🇵🇹', req: true }, { code: 'en', flag: '🇬🇧', req: false }, { code: 'es', flag: '🇪🇸', req: false }].map(({ code, flag, req }, i) => (
                      <div key={code} className="flex items-center gap-1.5">
                        <span className="text-xs w-5 text-center shrink-0">{flag}</span>
                        <input
                          type="text"
                          placeholder={`Nome ${code.toUpperCase()}${req ? ' *' : ''}`}
                          value={newCatNames[code]}
                          onChange={e => setNewCatNames(n => ({ ...n, [code]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddCat(); if (e.key === 'Escape') { setShowNewCat(false); setNewCatNames({ pt: '', en: '', es: '' }); } }}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                          autoFocus={i === 0}
                        />
                      </div>
                    ))}
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button type="button" onClick={handleAddCat} disabled={!newCatNames.pt.trim()} className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                        <Check size={13} />
                      </button>
                      <button type="button" onClick={() => { setShowNewCat(false); setNewCatNames({ pt: '', en: '', es: '' }); }} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {catLoading ? (
                  <div className="py-3 flex justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {categories.map(cat => (
                      <div
                        key={cat.id || cat.slug}
                        className={`group flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                          form.category === cat.slug ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {editingCatId === cat.id ? (
                          <div className="flex-1 space-y-1">
                            {[{ code: 'pt', flag: '🇵🇹' }, { code: 'en', flag: '🇬🇧' }, { code: 'es', flag: '🇪🇸' }].map(({ code, flag }, i) => (
                              <div key={code} className="flex items-center gap-1.5">
                                <span className="text-xs w-5 text-center shrink-0">{flag}</span>
                                <input
                                  type="text"
                                  value={editingCatNames[code]}
                                  onChange={e => setEditingCatNames(n => ({ ...n, [code]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter') handleUpdateCat(); if (e.key === 'Escape') setEditingCatId(null); }}
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                                  autoFocus={i === 0}
                                />
                              </div>
                            ))}
                            <div className="flex justify-end gap-1 pt-0.5">
                              <button type="button" onClick={handleUpdateCat} className="p-1 rounded text-primary hover:bg-primary/15 transition-colors"><Check size={12} /></button>
                              <button type="button" onClick={() => setEditingCatId(null)} className="p-1 rounded text-gray-400 hover:bg-gray-100 transition-colors"><X size={12} /></button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                              <input
                                type="radio"
                                name="category"
                                value={cat.slug}
                                checked={form.category === cat.slug}
                                onChange={() => set('category', cat.slug)}
                                className="accent-primary"
                              />
                              <span className="text-sm font-medium">{cat[`name_${activeLang}`] || cat.name_pt || cat.name}</span>
                            </label>
                            {cat.id && (
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => { setEditingCatId(cat.id); setEditingCatNames({ pt: cat.name_pt || '', en: cat.name_en || '', es: cat.name_es || '' }); setShowNewCat(false); }}
                                  className="p-1 rounded text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                  title="Editar"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCat(cat)}
                                  className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Translation hint */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Dica:</strong> Os campos EN e ES são opcionais. Se ficarem vazios, o conteúdo PT será usado automaticamente.
                {aiReady && (
                  <span className="block mt-1">
                    💡 Use os botões de IA para traduzir automaticamente do PT para EN e ES.
                  </span>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* AI Loading Overlay */}
        {aiLoading && (
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-2xl shadow-lg px-8 py-6 flex items-center gap-4 pointer-events-auto">
              <Loader2 size={24} className="animate-spin text-primary" />
              <div>
                <p className="font-semibold text-gray-900">IA a processar</p>
                <p className="text-sm text-gray-500">{aiOperation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPickerModal
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaPicker(false)}
          defaultFolder="blog"
        />
      )}

      {/* AI Generate Modal */}
      {showAIModal && (
        <AIGenerateModal
          type="blog"
          onGenerate={handleAIGenerate}
          loading={aiLoading}
          operation={aiOperation}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </>
  );
};

export default BlogArticleEditor;
