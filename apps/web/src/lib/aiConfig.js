/**
 * AI Configuration Manager
 *
 * Stores and retrieves AI provider settings from localStorage.
 * Keys: openai API key, openrouter API key, active provider, models.
 */

const STORAGE_KEY = 'dc_ai_config';

const DEFAULT_CONFIG = {
  activeProvider: 'openai', // 'openai' | 'openrouter'
  openai: {
    apiKey: '',
    model: 'gpt-5-mini',
  },
  openrouter: {
    apiKey: '',
    model: 'google/gemini-3.1-flash-lite-preview',
  },
};

/** Pre-defined model lists for each provider */
export const OPENAI_MODELS = [
  // ── GPT-5 series (mais recentes, Mar 2026) ──────────────────────────────
  { value: 'gpt-5.4',         label: 'GPT-5.4 ✨',       description: 'Mais recente e poderoso da OpenAI' },
  { value: 'gpt-5.4-pro',     label: 'GPT-5.4 Pro ✨',   description: 'Versão Pro do 5.4, mais preciso' },
  { value: 'gpt-5-mini',      label: 'GPT-5 Mini',       description: 'GPT-5 econômico para tarefas bem definidas' },
  { value: 'gpt-5-nano',      label: 'GPT-5 Nano',       description: 'GPT-5 ultra econômico e rápido' },
  { value: 'gpt-5',           label: 'GPT-5',            description: 'GPT-5 base, raciocínio avançado' },
  // ── GPT-4.1 series ──────────────────────────────────────────────────────
  { value: 'gpt-4.1',         label: 'GPT-4.1',          description: 'Melhor modelo não-reasoning da geração 4' },
  { value: 'gpt-4.1-mini',    label: 'GPT-4.1 Mini',     description: 'Bom equilíbrio custo/qualidade' },
  { value: 'gpt-4.1-nano',    label: 'GPT-4.1 Nano',     description: 'Ultra econômico' },
  // ── GPT-4o series ───────────────────────────────────────────────────────
  { value: 'gpt-4o',          label: 'GPT-4o',           description: 'Rápido e inteligente, multimodal' },
  { value: 'gpt-4o-mini',     label: 'GPT-4o Mini',      description: 'Leve e barato para tarefas simples' },
  // ── Raciocínio (o-series) ────────────────────────────────────────────────
  { value: 'o4-mini',         label: 'o4-mini',          description: 'Raciocínio rápido e econômico' },
  { value: 'o3',              label: 'o3',               description: 'Raciocínio avançado para tarefas complexas' },
  // ── Legado ───────────────────────────────────────────────────────────────
  { value: 'gpt-3.5-turbo',   label: 'GPT-3.5 Turbo',   description: 'Legado — mais barato, qualidade inferior' },
];

export const OPENROUTER_MODELS = [
  // ── OpenAI via OpenRouter ────────────────────────────────────────────────
  { value: 'openai/gpt-5.4',                        label: 'GPT-5.4 ✨',                description: 'Mais recente OpenAI, 1M contexto' },
  { value: 'openai/gpt-5.4-pro',                    label: 'GPT-5.4 Pro ✨',            description: 'Versão Pro do GPT-5.4' },
  { value: 'openai/gpt-5.3-chat',                   label: 'GPT-5.3 Chat',             description: 'Conversação fluida e precisa' },
  { value: 'openai/gpt-5-mini',                     label: 'GPT-5 Mini',               description: 'GPT-5 econômico via OpenRouter' },
  // ── Anthropic Claude ─────────────────────────────────────────────────────
  { value: 'anthropic/claude-sonnet-4',             label: 'Claude Sonnet 4',          description: 'Excelente em texto criativo e redação' },
  { value: 'anthropic/claude-3.7-sonnet',           label: 'Claude 3.7 Sonnet',        description: 'Ótimo equilíbrio inteligência/custo' },
  { value: 'anthropic/claude-3.5-haiku',            label: 'Claude 3.5 Haiku',         description: 'Rápido e barato para tarefas simples' },
  // ── Google Gemini ─────────────────────────────────────────────────────────
  { value: 'google/gemini-3.1-flash-lite-preview',  label: 'Gemini 3.1 Flash Lite ✨', description: 'Novo da Google, muito econômico' },
  { value: 'google/gemini-2.5-flash-preview',       label: 'Gemini 2.5 Flash',         description: 'Rápido com capacidade de raciocínio' },
  { value: 'google/gemini-2.0-flash-001',           label: 'Gemini 2.0 Flash',         description: 'Econômico e veloz' },
  // ── Meta Llama ───────────────────────────────────────────────────────────
  { value: 'meta-llama/llama-3.1-70b-instruct',     label: 'Llama 3.1 70B',            description: 'Open source, pode ser gratuito' },
  { value: 'meta-llama/llama-3.3-70b-instruct',     label: 'Llama 3.3 70B',            description: 'Versão mais recente do Llama 70B' },
  // ── Qwen / Alibaba ───────────────────────────────────────────────────────
  { value: 'qwen/qwen3.5-35b-a3b',                  label: 'Qwen 3.5 35B ✨',          description: 'Novo, alta eficiência, 262K contexto' },
  { value: 'qwen/qwen-2.5-72b-instruct',            label: 'Qwen 2.5 72B',             description: 'Excelente em multilíngue' },
  // ── DeepSeek ─────────────────────────────────────────────────────────────
  { value: 'deepseek/deepseek-chat',                label: 'DeepSeek V3',              description: 'Muito econômico, boa qualidade' },
  { value: 'deepseek/deepseek-r1',                  label: 'DeepSeek R1',              description: 'Raciocínio open source, muito preciso' },
  // ── Mistral ──────────────────────────────────────────────────────────────
  { value: 'mistralai/mistral-large',               label: 'Mistral Large',            description: 'Modelo topo da Mistral' },
  { value: 'mistralai/mixtral-8x7b-instruct',       label: 'Mixtral 8x7B',             description: 'Bom em multilíngue, econômico' },
  // ── Outros ───────────────────────────────────────────────────────────────
  { value: 'inception/mercury-2',                   label: 'Mercury 2 ✨',             description: 'Ultra rápido (+1000 tok/s), econômico' },
  { value: 'bytedance-seed/seed-2.0-mini',          label: 'Seed 2.0 Mini',            description: 'ByteDance, rápido e barato, 256K contexto' },
];

/**
 * Read the full AI configuration object from localStorage.
 * @returns {typeof DEFAULT_CONFIG}
 */
export function getAIConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle new keys added after initial save
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      openai: { ...DEFAULT_CONFIG.openai, ...parsed.openai },
      openrouter: { ...DEFAULT_CONFIG.openrouter, ...parsed.openrouter },
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save the full AI configuration object to localStorage.
 * @param {typeof DEFAULT_CONFIG} config
 */
export function saveAIConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Get the API key for a specific provider.
 * @param {'openai' | 'openrouter'} provider
 * @returns {string}
 */
export function getAPIKey(provider) {
  const config = getAIConfig();
  return config[provider]?.apiKey || '';
}

/**
 * Get the selected model for a specific provider.
 * @param {'openai' | 'openrouter'} provider
 * @returns {string}
 */
export function getModel(provider) {
  const config = getAIConfig();
  return config[provider]?.model || DEFAULT_CONFIG[provider].model;
}

/**
 * Get the currently active provider.
 * @returns {'openai' | 'openrouter'}
 */
export function getActiveProvider() {
  const config = getAIConfig();
  return config.activeProvider || 'openai';
}

/**
 * Check if the active provider is configured (has API key).
 * @returns {{ configured: boolean, provider: string, message: string }}
 */
export function checkAIReady() {
  const config = getAIConfig();
  const provider = config.activeProvider;
  const key = config[provider]?.apiKey;

  if (!key) {
    return {
      configured: false,
      provider,
      message: `API key do ${provider === 'openai' ? 'OpenAI' : 'OpenRouter'} não configurada. Vá a Configurações de IA para definir.`,
    };
  }

  return { configured: true, provider, message: '' };
}
