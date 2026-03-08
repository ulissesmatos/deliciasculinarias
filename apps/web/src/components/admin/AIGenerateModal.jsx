import React, { useState } from 'react';
import { Sparkles, Loader2, X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RECIPE_SUGGESTIONS = [
  'Sandes de frango grelhado com molho de mostarda e mel',
  'Pão caseiro de alho com ervas finas e queijo parmesão',
  'Molho barbecue defumado com chipotle e melaço',
  'Sandes vegetariana de beringela grelhada com húmus',
  'Pão brioche artesanal com manteiga e açafrão',
  'Molho de tomate italiano clássico com manjericão fresco',
];

const BLOG_SUGGESTIONS = [
  'As 10 melhores combinações de pão e queijo para sandes gourmet',
  'Guia completo de técnicas de fermentação para pães artesanais',
  'História da sandes: desde o Conde de Sandwich até hoje',
  'Como fazer molhos caseiros que elevam qualquer sandes',
  '5 tendências gastronômicas de sandes para experimentar em casa',
  'Ingredientes especiais que todo amante de sandes deveria conhecer',
];

/**
 * Modal overlay for generating content with AI.
 *
 * @param {{ type: 'recipe' | 'blog', onGenerate: (prompt: string) => void, loading: boolean, operation: string, onClose: () => void }} props
 */
const AIGenerateModal = ({ type = 'recipe', onGenerate, loading, operation, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const suggestions = type === 'recipe' ? RECIPE_SUGGESTIONS : BLOG_SUGGESTIONS;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onGenerate(prompt.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">
                {type === 'recipe' ? 'Gerar Receita com IA' : 'Gerar Artigo com IA'}
              </h2>
              <p className="text-sm text-gray-500">
                Descreva o que pretende e a IA criará o conteúdo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {type === 'recipe'
                ? 'Descreva a receita que quer criar:'
                : 'Descreva o artigo que quer criar:'}
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none disabled:opacity-60"
              placeholder={
                type === 'recipe'
                  ? 'Ex: Uma sandes de frango grelhado com molho de mostarda e mel, com alface crocante e tomate...'
                  : 'Ex: Um artigo sobre as melhores técnicas de fermentação para pães artesanais...'
              }
              autoFocus
            />
          </div>

          {/* Suggestions */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={14} className="text-amber-500" />
              <span className="text-xs font-medium text-gray-500">Sugestões rápidas:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={loading}
                  onClick={() => setPrompt(s)}
                  className="text-xs bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-600 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                >
                  {s.length > 50 ? s.slice(0, 50) + '…' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Action */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 h-11"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {operation || 'A processar…'}
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {type === 'recipe' ? 'Gerar Receita' : 'Gerar Artigo'}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer note */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-400 text-center">
            O conteúdo gerado será inserido nos campos em Português. Revise antes de guardar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIGenerateModal;
