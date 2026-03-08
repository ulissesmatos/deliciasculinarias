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
    model: 'gpt-4o-mini',
  },
  openrouter: {
    apiKey: '',
    model: 'google/gemini-2.0-flash-001',
  },
};

/** Pre-defined model lists for each provider */
export const OPENAI_MODELS = [
  { value: 'gpt-4o',          label: 'GPT-4o',          description: 'Mais capaz, melhor qualidade' },
  { value: 'gpt-4o-mini',     label: 'GPT-4o Mini',     description: 'Bom equilíbrio custo/qualidade' },
  { value: 'gpt-4.1',         label: 'GPT-4.1',         description: 'Último modelo, alta performance' },
  { value: 'gpt-4.1-mini',    label: 'GPT-4.1 Mini',    description: 'Versão econômica do 4.1' },
  { value: 'gpt-4.1-nano',    label: 'GPT-4.1 Nano',    description: 'Ultra econômico' },
  { value: 'gpt-3.5-turbo',   label: 'GPT-3.5 Turbo',   description: 'Econômico, bom para traduções' },
];

export const OPENROUTER_MODELS = [
  { value: 'anthropic/claude-sonnet-4',             label: 'Claude Sonnet 4',          description: 'Excelente em texto criativo' },
  { value: 'google/gemini-2.0-flash-001',           label: 'Gemini 2.0 Flash',         description: 'Rápido e econômico' },
  { value: 'google/gemini-2.5-flash-preview',       label: 'Gemini 2.5 Flash Preview', description: 'Último da Google' },
  { value: 'meta-llama/llama-3.1-70b-instruct',     label: 'Llama 3.1 70B',            description: 'Open source, pode ser gratuito' },
  { value: 'mistralai/mixtral-8x7b-instruct',       label: 'Mixtral 8x7B',             description: 'Bom em multilíngue' },
  { value: 'deepseek/deepseek-chat',                label: 'DeepSeek Chat',            description: 'Muito econômico' },
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
