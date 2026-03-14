import React, { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Reusable modal for generating an image with AI.
 *
 * @param {{
 *   subject: string,
 *   onGenerate: (prompt: string) => void,
 *   loading: boolean,
 *   operation: string,
 *   onClose: () => void
 * }} props
 */
const AIImageModal = ({ subject = '', onGenerate, loading, operation, onClose }) => {
  const [prompt, setPrompt] = useState(
    subject ? `Fotografia culinária profissional de: ${subject}. Estilo editorial, fundo neutro, iluminação suave, apetitosa.` : ''
  );

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
              <h2 className="font-bold text-gray-900">Gerar Imagem com IA</h2>
              <p className="text-sm text-gray-500">DALL-E irá criar a imagem a partir do prompt</p>
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
              Descreva a imagem que pretende gerar:
            </label>
            <textarea
              rows={5}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none disabled:opacity-60"
              placeholder="Ex: Fotografia culinária profissional de um sanduíche de frango grelhado, estilo editorial, fundo neutro..."
              autoFocus
            />
          </div>

          <p className="text-xs text-gray-400">
            A imagem será convertida para WebP e adicionada à biblioteca de media.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {operation || 'A gerar…'}
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Gerar Imagem
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIImageModal;
