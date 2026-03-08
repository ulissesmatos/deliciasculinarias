import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Plus, Trash2, Save, ImageIcon, Sparkles, Globe, Loader2 } from 'lucide-react';
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

const DIFFICULTIES = [
  { value: 'Easy',   label: 'Fácil' },
  { value: 'Medium', label: 'Médio' },
  { value: 'Hard',   label: 'Difícil' },
];

const emptyForm = () => ({
  title_pt: '', title_en: '', title_es: '',
  description_pt: '', description_en: '', description_es: '',
  ingredients_pt: [''],
  ingredients_en: [''],
  ingredients_es: [''],
  instructions_pt: [''],
  instructions_en: [''],
  instructions_es: [''],
  prep_time: '',
  servings: '',
  difficulty_level: 'Easy',
  featured_image: null,
});

const RecipeEditor = () => {
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
  const [showAIModal, setShowAIModal] = useState(false);
  const fileInputRef = useRef(null);
  const { loading: aiLoading, operation: aiOperation, aiGenerateRecipe, aiTranslateRecipe } = useAI();
  const aiReady = checkAIReady().configured;

  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      try {
        const r = await pb.collection('recipes').getOne(id, { $autoCancel: false });
        setForm({
          title_pt: r.title_pt || '',
          title_en: r.title_en || '',
          title_es: r.title_es || '',
          description_pt: r.description_pt || '',
          description_en: r.description_en || '',
          description_es: r.description_es || '',
          ingredients_pt: r.ingredients_pt?.length ? r.ingredients_pt : [''],
          ingredients_en: r.ingredients_en?.length ? r.ingredients_en : [''],
          ingredients_es: r.ingredients_es?.length ? r.ingredients_es : [''],
          instructions_pt: r.instructions_pt?.length ? r.instructions_pt : [''],
          instructions_en: r.instructions_en?.length ? r.instructions_en : [''],
          instructions_es: r.instructions_es?.length ? r.instructions_es : [''],
          prep_time: r.prep_time || '',
          servings: r.servings || '',
          difficulty_level: r.difficulty_level || 'Easy',
          featured_image: null,
        });
        if (r.featured_image) {
          setExistingImage(pb.files.getUrl(r, r.featured_image, { thumb: '400x300' }));
        }
      } catch (err) {
        toast({ title: 'Erro', description: 'Não foi possível carregar a receita.', variant: 'destructive' });
        navigate('/admin/recipes');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  /* ---------- list helpers ---------- */
  const updateListItem = (field, index, value) =>
    setForm(f => ({ ...f, [field]: f[field].map((v, i) => (i === index ? value : v)) }));

  const addListItem = (field) =>
    setForm(f => ({ ...f, [field]: [...f[field], ''] }));

  const removeListItem = (field, index) =>
    setForm(f => ({ ...f, [field]: f[field].length === 1 ? [''] : f[field].filter((_, i) => i !== index) }));

  /* ---------- image ---------- */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set('featured_image', file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* ---------- AI handlers ---------- */
  const handleAIGenerate = async (prompt) => {
    const result = await aiGenerateRecipe(prompt, 'pt');
    if (!result) return;

    const hasContent = form.title_pt.trim();
    if (hasContent && !window.confirm('Isto irá substituir o conteúdo PT existente. Continuar?')) return;

    setForm(f => ({
      ...f,
      title_pt: result.title || f.title_pt,
      description_pt: result.description || f.description_pt,
      ingredients_pt: result.ingredients?.length ? result.ingredients : f.ingredients_pt,
      instructions_pt: result.instructions?.length ? result.instructions : f.instructions_pt,
      prep_time: result.prep_time || f.prep_time,
      servings: result.servings || f.servings,
      difficulty_level: ['Easy', 'Medium', 'Hard'].includes(result.difficulty_level)
        ? result.difficulty_level : f.difficulty_level,
    }));
    setActiveLang('pt');
    setShowAIModal(false);
    toast({ title: 'Receita gerada!', description: 'Revise o conteúdo e faça ajustes se necessário.' });
  };

  const handleAITranslate = async (toLang) => {
    if (!form.title_pt.trim()) {
      toast({ title: 'Sem conteúdo PT', description: 'Preencha a receita em Português primeiro.', variant: 'destructive' });
      return;
    }

    const hasContent = form[`title_${toLang}`].trim();
    if (hasContent && !window.confirm(`Isto irá substituir o conteúdo ${toLang.toUpperCase()} existente. Continuar?`)) return;

    const clean = arr => arr.filter(v => v.trim() !== '');
    const recipe = {
      title: form.title_pt,
      description: form.description_pt,
      ingredients: clean(form.ingredients_pt),
      instructions: clean(form.instructions_pt),
    };

    const result = await aiTranslateRecipe(recipe, 'pt', toLang);
    if (!result) return;

    setForm(f => ({
      ...f,
      [`title_${toLang}`]: result.title || '',
      [`description_${toLang}`]: result.description || '',
      [`ingredients_${toLang}`]: result.ingredients?.length ? result.ingredients : f[`ingredients_${toLang}`],
      [`instructions_${toLang}`]: result.instructions?.length ? result.instructions : f[`instructions_${toLang}`],
    }));
    setActiveLang(toLang);
    toast({ title: `Traduzido para ${toLang.toUpperCase()}!` });
  };

  const handleAITranslateAll = async () => {
    if (!form.title_pt.trim()) {
      toast({ title: 'Sem conteúdo PT', description: 'Preencha a receita em Português primeiro.', variant: 'destructive' });
      return;
    }
    await handleAITranslate('en');
    await handleAITranslate('es');
    toast({ title: 'Tradução completa!', description: 'EN e ES traduzidos a partir do PT.' });
  };

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title_pt.trim()) {
      toast({ title: 'Campo obrigatório', description: 'O título em PT é obrigatório.', variant: 'destructive' });
      setActiveLang('pt');
      return;
    }

    setSaving(true);
    try {
      // Auto-fill EN/ES from PT when empty
      const titleEn = form.title_en.trim() || form.title_pt;
      const titleEs = form.title_es.trim() || form.title_pt;
      const clean = arr => arr.filter(v => v.trim() !== '');

      const data = new FormData();
      data.append('title',    titleEn);           // base required field
      data.append('title_pt', form.title_pt);
      data.append('title_en', titleEn);
      data.append('title_es', titleEs);
      data.append('description_pt', form.description_pt);
      data.append('description_en', form.description_en || form.description_pt);
      data.append('description_es', form.description_es || form.description_pt);
      data.append('ingredients_pt', JSON.stringify(clean(form.ingredients_pt)));
      data.append('ingredients_en', JSON.stringify(clean(form.ingredients_en).length ? clean(form.ingredients_en) : clean(form.ingredients_pt)));
      data.append('ingredients_es', JSON.stringify(clean(form.ingredients_es).length ? clean(form.ingredients_es) : clean(form.ingredients_pt)));
      data.append('instructions_pt', JSON.stringify(clean(form.instructions_pt)));
      data.append('instructions_en', JSON.stringify(clean(form.instructions_en).length ? clean(form.instructions_en) : clean(form.instructions_pt)));
      data.append('instructions_es', JSON.stringify(clean(form.instructions_es).length ? clean(form.instructions_es) : clean(form.instructions_pt)));
      data.append('prep_time', form.prep_time || 0);
      data.append('servings',  form.servings  || 0);
      data.append('difficulty_level', form.difficulty_level);
      if (form.featured_image) data.append('featured_image', form.featured_image);

      if (isEditing) {
        await pb.collection('recipes').update(id, data, { $autoCancel: false });
      } else {
        await pb.collection('recipes').create(data, { $autoCancel: false });
      }

      toast({ title: 'Guardado com sucesso!' });
      navigate('/admin/recipes');
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
        <title>{isEditing ? 'Editar Receita' : 'Nova Receita'} - Admin</title>
      </Helmet>

      <div className="min-h-full bg-gray-50">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/recipes')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-none">
                  {isEditing ? 'Editar Receita' : 'Nova Receita'}
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
              <Button type="button" variant="outline" onClick={() => navigate('/admin/recipes')}>
                Cancelar
              </Button>
              <Button type="submit" form="recipe-form" disabled={saving} className="flex items-center gap-2">
                <Save size={16} />
                {saving ? 'A guardar…' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>

        <form id="recipe-form" onSubmit={handleSubmit} className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left column — translatable content */}
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
                      placeholder={activeLang !== 'pt' ? `Deixar vazio para usar o PT` : 'Ex: Sandes de Frango Grelhado'}
                      value={form[`title_${activeLang}`]}
                      onChange={e => set(`title_${activeLang}`, e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      Descrição
                      <span className="ml-1 font-normal text-gray-400">({activeLang.toUpperCase()})</span>
                    </Label>
                    <textarea
                      rows={3}
                      className="mt-1.5 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      placeholder={activeLang !== 'pt' ? 'Deixar vazio para usar o PT' : 'Breve descrição da receita…'}
                      value={form[`description_${activeLang}`]}
                      onChange={e => set(`description_${activeLang}`, e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">
                    Ingredientes
                    <span className="ml-1 text-sm font-normal text-gray-400">({activeLang.toUpperCase()})</span>
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addListItem(`ingredients_${activeLang}`)}
                    className="flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {form[`ingredients_${activeLang}`].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5 text-right shrink-0">{idx + 1}.</span>
                      <Input
                        value={item}
                        onChange={e => updateListItem(`ingredients_${activeLang}`, idx, e.target.value)}
                        placeholder={`Ex: 200g de frango${idx === 0 ? ' grelhado' : ''}`}
                        className="text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeListItem(`ingredients_${activeLang}`, idx)}
                        className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">
                    Instruções / Modo de Preparo
                    <span className="ml-1 text-sm font-normal text-gray-400">({activeLang.toUpperCase()})</span>
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addListItem(`instructions_${activeLang}`)}
                    className="flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar Passo
                  </Button>
                </div>
                <div className="space-y-3">
                  {form[`instructions_${activeLang}`].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="mt-2.5 text-xs font-semibold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <textarea
                        rows={2}
                        value={step}
                        onChange={e => updateListItem(`instructions_${activeLang}`, idx, e.target.value)}
                        placeholder={`Passo ${idx + 1}…`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeListItem(`instructions_${activeLang}`, idx)}
                        className="mt-2 shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column — metadata */}
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

              {/* Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Detalhes</h2>

                <div>
                  <Label className="text-sm text-gray-700">Tempo de Preparo (min)</Label>
                  <Input
                    type="number"
                    min="0"
                    className="mt-1.5"
                    placeholder="Ex: 30"
                    value={form.prep_time}
                    onChange={e => set('prep_time', e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-700">Porções</Label>
                  <Input
                    type="number"
                    min="1"
                    className="mt-1.5"
                    placeholder="Ex: 4"
                    value={form.servings}
                    onChange={e => set('servings', e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-700">Dificuldade</Label>
                  <select
                    className="mt-1.5 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    value={form.difficulty_level}
                    onChange={e => set('difficulty_level', e.target.value)}
                  >
                    {DIFFICULTIES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
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
          type="recipe"
          onGenerate={handleAIGenerate}
          loading={aiLoading}
          operation={aiOperation}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </>
  );
};

export default RecipeEditor;
