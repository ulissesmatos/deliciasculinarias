import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Save, ImageIcon, Eye, EyeOff, Sparkles, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAI } from '@/hooks/useAI.js';
import { checkAIReady } from '@/lib/aiConfig.js';
import AIGenerateModal from '@/components/admin/AIGenerateModal.jsx';
import pb from '@/lib/pocketbaseClient.js';

const LANGS = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

const CATEGORIES = [
  { value: 'sandwiches',          label: 'Sandes' },
  { value: 'breads',              label: 'Pães' },
  { value: 'sauces',              label: 'Molhos' },
  { value: 'combinations',        label: 'Combinações' },
  { value: 'techniques',          label: 'Técnicas' },
  { value: 'special_ingredients', label: 'Ingredientes Especiais' },
];

const emptyForm = () => ({
  title_pt: '', title_en: '', title_es: '',
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
  const [showPreview, setShowPreview] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const fileInputRef = useRef(null);
  const { loading: aiLoading, operation: aiOperation, aiGenerateBlogArticle, aiTranslateBlogArticle } = useAI();
  const aiReady = checkAIReady().configured;

  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      try {
        const r = await pb.collection('blog_articles').getOne(id, { $autoCancel: false });
        setForm({
          title_pt: r.title_pt || '',
          title_en: r.title_en || '',
          title_es: r.title_es || '',
          description_pt: r.description_pt || '',
          description_en: r.description_en || '',
          description_es: r.description_es || '',
          content_pt: r.content_pt || '',
          content_en: r.content_en || '',
          content_es: r.content_es || '',
          category: r.category || 'sandwiches',
          featured_image: null,
        });
        if (r.featured_image) {
          setExistingImage(pb.files.getUrl(r, r.featured_image, { thumb: '400x300' }));
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set('featured_image', file);
    setImagePreview(URL.createObjectURL(file));
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
      category: CATEGORIES.some(c => c.value === result.category) ? result.category : f.category,
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
      data.append('description_pt', form.description_pt);
      data.append('description_en', form.description_en || form.description_pt);
      data.append('description_es', form.description_es || form.description_pt);
      data.append('content_pt', form.content_pt);
      data.append('content_en', form.content_en || form.content_pt);
      data.append('content_es', form.content_es || form.content_pt);
      data.append('category', form.category);
      if (form.featured_image) data.append('featured_image', form.featured_image);

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

  // Simple markdown→HTML for preview (bold, italic, headings, lists)
  const renderPreview = (text) => {
    if (!text) return '<p class="text-gray-400 italic">Sem conteúdo ainda…</p>';
    return text
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-2">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/^(?!<[hli])(.+)$/gm, '<p class="mb-3">$1</p>');
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
                      onChange={e => set(`title_${activeLang}`, e.target.value)}
                    />
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
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">Suporta Markdown</span>
                    <button
                      type="button"
                      onClick={() => setShowPreview(v => !v)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                    >
                      {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showPreview ? 'Editar' : 'Preview'}
                    </button>
                  </div>
                </div>

                {showPreview ? (
                  <div
                    className="p-6 min-h-64 prose prose-sm max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{ __html: renderPreview(form[`content_${activeLang}`]) }}
                  />
                ) : (
                  <div className="p-6">
                    <textarea
                      rows={18}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
                      placeholder={`# Título principal\n\nIntrodução do artigo…\n\n## Secção 1\n\nTexto da secção…\n\n- item da lista\n- outro item`}
                      value={form[`content_${activeLang}`]}
                      onChange={e => set(`content_${activeLang}`, e.target.value)}
                    />
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                      <span><code className="bg-gray-100 px-1 rounded"># Título</code></span>
                      <span><code className="bg-gray-100 px-1 rounded">## Secção</code></span>
                      <span><code className="bg-gray-100 px-1 rounded">**negrito**</code></span>
                      <span><code className="bg-gray-100 px-1 rounded">*itálico*</code></span>
                      <span><code className="bg-gray-100 px-1 rounded">- lista</code></span>
                    </div>
                  </div>
                )}
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
                <div
                  className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors mb-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {(imagePreview || existingImage) ? (
                    <img
                      src={imagePreview || existingImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon size={32} />
                      <span className="mt-2 text-sm">Clica para escolher</span>
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview || existingImage ? 'Alterar imagem' : 'Escolher imagem'}
                </Button>
              </div>

              {/* Category */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Categoria</h2>
                <div className="space-y-2">
                  {CATEGORIES.map(cat => (
                    <label
                      key={cat.value}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        form.category === cat.value
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat.value}
                        checked={form.category === cat.value}
                        onChange={() => set('category', cat.value)}
                        className="accent-primary"
                      />
                      {cat.label}
                    </label>
                  ))}
                </div>
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
