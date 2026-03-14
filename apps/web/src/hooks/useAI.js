/**
 * useAI — React hook for AI operations with loading state and error handling.
 */

import { useState, useCallback } from 'react';
import { checkAIReady } from '@/lib/aiConfig.js';
import {
  generateRecipe,
  translateRecipe,
  generateBlogArticle,
  translateBlogArticle,
  testConnection,
  generateImage,
  generateArticleImagePrompts,
} from '@/lib/aiService.js';
import { useToast } from '@/hooks/use-toast';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState(''); // current operation label
  const { toast } = useToast();

  /** Wrap an async AI call with loading state and error toast */
  const run = useCallback(async (label, fn) => {
    const check = checkAIReady();
    if (!check.configured) {
      toast({ title: 'IA não configurada', description: check.message, variant: 'destructive' });
      return null;
    }

    setLoading(true);
    setOperation(label);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      console.error(`[useAI] ${label} error:`, err);
      toast({
        title: 'Erro de IA',
        description: err.message || 'Ocorreu um erro ao contactar a IA.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
      setOperation('');
    }
  }, [toast]);

  /* ---------- Recipe operations ---------- */

  const aiGenerateRecipe = useCallback((prompt, lang = 'pt') => {
    return run('A gerar receita…', () => generateRecipe(prompt, lang));
  }, [run]);

  const aiTranslateRecipe = useCallback((recipe, fromLang, toLang) => {
    const langLabels = { pt: 'PT', en: 'EN', es: 'ES' };
    return run(
      `A traduzir ${langLabels[fromLang]} → ${langLabels[toLang]}…`,
      () => translateRecipe(recipe, fromLang, toLang)
    );
  }, [run]);

  /* ---------- Blog operations ---------- */

  const aiGenerateBlogArticle = useCallback((prompt, lang = 'pt') => {
    return run('A gerar artigo…', () => generateBlogArticle(prompt, lang));
  }, [run]);

  const aiTranslateBlogArticle = useCallback((article, fromLang, toLang) => {
    const langLabels = { pt: 'PT', en: 'EN', es: 'ES' };
    return run(
      `A traduzir ${langLabels[fromLang]} → ${langLabels[toLang]}…`,
      () => translateBlogArticle(article, fromLang, toLang)
    );
  }, [run]);

  /* ---------- Image ---------- */

  const aiGenerateImage = useCallback((prompt) => {
    return run('A gerar imagem…', () => generateImage(prompt));
  }, [run]);

  const aiGetArticleImagePrompts = useCallback((title, h2Sections) => {
    return run('A planear imagens…', () => generateArticleImagePrompts(title, h2Sections));
  }, [run]);

  /* ---------- Test ---------- */

  const aiTestConnection = useCallback((provider, apiKey, model) => {
    return run('A testar conexão…', () => testConnection(provider, apiKey, model));
  }, [run]);

  return {
    loading,
    operation,
    aiGenerateRecipe,
    aiTranslateRecipe,
    aiGenerateBlogArticle,
    aiTranslateBlogArticle,
    aiGetArticleImagePrompts,
    aiGenerateImage,
    aiTestConnection,
  };
}
