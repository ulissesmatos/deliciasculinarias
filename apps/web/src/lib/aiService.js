/**
 * AI Service — Unified abstraction over OpenAI and OpenRouter APIs.
 *
 * Both providers share the OpenAI-compatible chat completions format,
 * so the same request shape works for both (OpenRouter mirrors the API).
 *
 * Requests go through a Vite dev proxy to bypass CORS:
 *   /api/ai/openai/*     → https://api.openai.com/*
 *   /api/ai/openrouter/*  → https://openrouter.ai/api/*
 */

import { getAIConfig, getActiveProvider, getAPIKey, getModel } from './aiConfig.js';
import { marked } from 'marked';

/**
 * Convert Markdown string to HTML for use in the TipTap rich text editor.
 * marked is configured with breaks:true so single newlines become <br>.
 */
function markdownToHtml(md) {
  if (!md) return '';
  return marked.parse(md, { async: false, breaks: false, gfm: true });
}

/* ------------------------------------------------------------------ */
/*  Endpoints                                                          */
/* ------------------------------------------------------------------ */

const ENDPOINTS = {
  openai:     '/api/ai/openai/v1/chat/completions',
  openrouter: '/api/ai/openrouter/v1/chat/completions',
};

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

const LANG_NAMES = { pt: 'Portuguese', en: 'English', es: 'Spanish' };

/**
 * Make a chat completion request to the active provider.
 * Includes retry with exponential backoff for 429 responses.
 */
async function chatCompletion(messages, { temperature = 0.7, maxRetries = 2 } = {}) {
  const provider = getActiveProvider();
  const apiKey   = getAPIKey(provider);
  const model    = getModel(provider);

  if (!apiKey) {
    throw new Error(
      `API key do ${provider === 'openai' ? 'OpenAI' : 'OpenRouter'} não configurada. Configure em Configurações de IA.`
    );
  }

  const url = ENDPOINTS[provider];

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  // OpenRouter-specific headers
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'Delícias Culinárias Admin';
  }

  const body = JSON.stringify({
    model,
    messages,
    temperature,
  });

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body });

      if (res.status === 429) {
        // Rate limited — back off
        const wait = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = errBody?.error?.message || errBody?.message || `HTTP ${res.status}`;
        throw new Error(`Erro da API (${provider}): ${msg}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Resposta vazia da IA. Tente novamente.');
      }

      return content;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && err.message?.includes('429')) continue;
      throw err;
    }
  }

  throw lastError;
}

/**
 * Parse JSON from LLM response, handling markdown code fences.
 */
function parseJSONResponse(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('A IA retornou um formato inválido. Tente novamente com um prompt diferente.');
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Generate a full recipe from a prompt.
 * @param {string} prompt - User description of what recipe to create
 * @param {string} lang   - Target language code ('pt', 'en', 'es')
 * @returns {Promise<{
 *   title: string,
 *   description: string,
 *   ingredients: string[],
 *   instructions: string[],
 *   prep_time: number,
 *   cook_time: number,
 *   servings: number,
 *   difficulty_level: string,
 *   cuisine: string,
 *   keywords: string[],
 *   nutrition: { calories: string, protein: string, fat: string, carbohydrates: string, fiber: string, sugar: string, sodium: string }
 * }>}
 */
export async function generateRecipe(prompt, lang = 'pt') {
  const langName = LANG_NAMES[lang] || 'Portuguese';

  const messages = [
    {
      role: 'system',
      content: `You are a professional chef and recipe writer for a culinary website called "Delícias Culinárias" that specializes in sandwiches, breads, sauces, and related recipes.

Generate a complete recipe in ${langName} based on the user's request.

IMPORTANT: Respond ONLY with a valid JSON object, no additional text. Use this exact structure:
{
  "title": "Recipe title in ${langName}",
  "description": "Detailed, appetizing description (4-6 sentences, 80-150 words) in ${langName} — include the dish origin or inspiration, main flavors and textures, ideal occasion or pairing, and what makes it special. This will be used as the page description for SEO.",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity", ...],
  "instructions": ["Step 1 detailed instruction", "Step 2 detailed instruction", ...],
  "prep_time": 30,
  "cook_time": 20,
  "servings": 4,
  "difficulty_level": "Easy",
  "cuisine": "Mediterranean",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "nutrition": {
    "calories": "320 kcal",
    "protein": "18g",
    "fat": "12g",
    "carbohydrates": "35g",
    "fiber": "3g",
    "sugar": "5g",
    "sodium": "480mg"
  }
}

Rules:
- difficulty_level must be exactly one of: "Easy", "Medium", "Hard"
- prep_time and cook_time are in minutes (integers). cook_time is the active cooking time (0 if no cooking needed).
- servings is an integer
- ingredients should include quantities (e.g., "200g de frango grelhado")
- instructions should be detailed, clear steps
- Generate 5-15 ingredients and 4-10 instruction steps
- Make it delicious and practical
- cuisine should be in English (e.g., "Mediterranean", "American", "Italian", "Portuguese", "Mexican")
- keywords should be 5-8 relevant search terms in ${langName}
- nutrition values are estimated per serving; include units (kcal, g, mg)
- The description field is critical for SEO and Generative Engine Optimization (GEO): write it as a rich, standalone paragraph that search engines and AI assistants can surface as an answer. Naturally include relevant keywords, the cuisine style, key ingredients, and preparation highlights.`
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const raw = await chatCompletion(messages, { temperature: 0.8 });
  return parseJSONResponse(raw);
}

/**
 * Translate a recipe's text fields from one language to another.
 * @param {{ title: string, description: string, ingredients: string[], instructions: string[] }} recipe
 * @param {string} fromLang - Source language code
 * @param {string} toLang   - Target language code
 * @returns {Promise<{ title: string, description: string, ingredients: string[], instructions: string[] }>}
 */
export async function translateRecipe(recipe, fromLang, toLang) {
  const fromName = LANG_NAMES[fromLang] || fromLang;
  const toName   = LANG_NAMES[toLang]   || toLang;

  const messages = [
    {
      role: 'system',
      content: `You are a professional culinary translator. Translate the recipe content from ${fromName} to ${toName}.

IMPORTANT: Respond ONLY with a valid JSON object. Preserve quantities, technical cooking terms, and ingredient names accurately. Keep the same number of ingredients and instructions.

Output format:
{
  "title": "Translated title",
  "description": "Translated description",
  "ingredients": ["translated ingredient 1", "translated ingredient 2", ...],
  "instructions": ["translated step 1", "translated step 2", ...]
}`
    },
    {
      role: 'user',
      content: JSON.stringify({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
      }),
    },
  ];

  const raw = await chatCompletion(messages, { temperature: 0.3 });
  return parseJSONResponse(raw);
}

/**
 * Generate a blog article from a prompt.
 * @param {string} prompt - User description of the article
 * @param {string} lang   - Target language code
 * @returns {Promise<{ title: string, description: string, content: string, category: string }>}
 */
export async function generateBlogArticle(prompt, lang = 'pt') {
  const langName = LANG_NAMES[lang] || 'Portuguese';

  const messages = [
    {
      role: 'system',
      content: `You are a professional food blogger writing for "Delícias Culinárias", a website about sandwiches, breads, sauces, and culinary combinations.

Generate a complete blog article in ${langName} based on the user's request.

IMPORTANT: Respond ONLY with a valid JSON object:
{
  "title": "Article title in ${langName}",
  "description": "SEO-friendly meta description (1-2 sentences) in ${langName}",
  "content": "Full article content in Markdown format in ${langName}",
  "category": "sandwiches"
}

Rules for content:
- Do NOT include the article title (# heading) in the content — the title is already placed separately. Start directly with the introduction paragraph.
- Use Markdown: ## for sections, **bold**, *italic*, - for lists
- Write 400-800 words
- Include an engaging introduction, 2-4 sections, and a conclusion
- Be informative, appetizing, and SEO-friendly
- category must be one of: "sandwiches", "breads", "sauces", "combinations", "techniques", "special_ingredients"`
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const raw = await chatCompletion(messages, { temperature: 0.8 });
  const parsed = parseJSONResponse(raw);
  if (parsed?.content) parsed.content = markdownToHtml(parsed.content);
  return parsed;
}

/**
 * Translate a blog article from one language to another.
 * @param {{ title: string, description: string, content: string }} article
 * @param {string} fromLang
 * @param {string} toLang
 * @returns {Promise<{ title: string, description: string, content: string }>}
 */
export async function translateBlogArticle(article, fromLang, toLang) {
  const fromName = LANG_NAMES[fromLang] || fromLang;
  const toName   = LANG_NAMES[toLang]   || toLang;

  const messages = [
    {
      role: 'system',
      content: `You are a professional culinary content translator. Translate the blog article from ${fromName} to ${toName}.

IMPORTANT: Respond ONLY with a valid JSON object. Preserve Markdown formatting, links, and structure.

{
  "title": "Translated title",
  "description": "Translated description",
  "content": "Translated full article content (keep Markdown formatting)"
}`
    },
    {
      role: 'user',
      content: JSON.stringify({
        title: article.title,
        description: article.description,
        content: article.content,
      }),
    },
  ];

  const raw = await chatCompletion(messages, { temperature: 0.3 });
  const parsed = parseJSONResponse(raw);
  if (parsed?.content) parsed.content = markdownToHtml(parsed.content);
  return parsed;
}

/**
 * Test the connection to a specific provider.
 * @param {'openai' | 'openrouter'} provider
 * @param {string} apiKey
 * @param {string} model
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export async function testConnection(provider, apiKey, model) {
  const url = ENDPOINTS[provider];

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'Delícias Culinárias Admin';
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say "OK" and nothing else.' }],
        max_tokens: 5,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        ok: false,
        message: err?.error?.message || `HTTP ${res.status} — verifique a API key e o modelo.`,
      };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return { ok: true, message: `Conexão OK! Resposta: "${reply.trim()}"` };
  } catch (err) {
    return { ok: false, message: `Erro de rede: ${err.message}` };
  }
}

/**
 * Generate fresh content suggestions using the LLM.
 * @param {'recipe' | 'blog'} type
 * @returns {Promise<string[]>} Array of 6 suggestion strings
 */
export async function generateSuggestions(type = 'recipe') {
  const isRecipe = type === 'recipe';

  const messages = [
    {
      role: 'system',
      content: `You generate creative content ideas for "Delícias Culinárias", a Brazilian Portuguese culinary website about sandwiches, breads, sauces, and related recipes.

Respond ONLY with a valid JSON array of exactly 6 short suggestion strings in Brazilian Portuguese (pt-BR). Each suggestion should be 6-15 words.

${isRecipe
  ? 'Generate 6 creative, varied recipe ideas. Mix sandwich recipes, bread recipes, and sauce recipes. Example format: ["Sanduíche de costela desfiada com molho barbecue e coleslaw", ...]'
  : 'Generate 6 creative, varied blog article topic ideas about sandwiches, breads, sauces, or culinary techniques. Example format: ["Os segredos dos melhores sanduíches de rua do mundo", ...]'}

Be creative, trendy, and avoid repeating topics. Use Brazilian Portuguese (sanduíche, not sandes).`
    },
    { role: 'user', content: `Gere 6 sugestões ${isRecipe ? 'de receitas' : 'de artigos para o blog'} criativas e variadas.` },
  ];

  const raw = await chatCompletion(messages, { temperature: 1.0 });
  const parsed = parseJSONResponse(raw);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Formato inválido');
  }

  return parsed.slice(0, 6);
}

/**
 * Generate an image using OpenAI DALL-E.
 * Only works when the active provider is OpenAI.
 * Returns a base64-encoded PNG blob (as a Blob object).
 *
 * @param {string} prompt - Description of the image to generate
 * @returns {Promise<Blob>}
 */
export async function generateImage(prompt) {
  const provider = getActiveProvider();

  if (provider !== 'openai') {
    throw new Error('A geração de imagens requer o OpenAI como fornecedor ativo. Configure em Configurações de IA.');
  }

  const apiKey = getAPIKey('openai');
  if (!apiKey) {
    throw new Error('API key do OpenAI não configurada. Configure em Configurações de IA.');
  }

  const res = await fetch('/api/ai/openai/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Erro ao gerar imagem: ${msg}`);
  }

  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('Resposta de imagem vazia da API.');

  const byteChars = atob(b64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  return new Blob([bytes], { type: 'image/png' });
}

/**
 * Given a blog article title and its H2 section headings, ask the AI to
 * suggest 2-3 images with placement hints.
 *
 * @param {string}   articleTitle
 * @param {string[]} h2Sections   - Array of H2 heading text strings
 * @returns {Promise<Array<{ prompt: string, afterH2Text: string|null }>>}
 */
export async function generateArticleImagePrompts(articleTitle, h2Sections) {
  const hasH2s = h2Sections.length > 0;
  const sectionsList = hasH2s
    ? h2Sections.map((s, i) => `${i + 1}. "${s}"`).join('\n')
    : '(sem secções, apenas introdução)';

  const messages = [
    {
      role: 'system',
      content: `You are a culinary content editor for "Delícias Culinárias".
Given a blog article title and its section headings, suggest 2 to 3 images to visually enrich the article.

IMPORTANT: Respond ONLY with a valid JSON array of 2 or 3 objects:
[
  { "prompt": "...", "afterH2Text": "exact section title or null" },
  ...
]

Rules:
- Each "prompt" must be in English, detailed culinary food photography style.
  Format: "Professional culinary food photography, [specific subject], editorial style, soft natural lighting, neutral background, appetizing, high resolution"
- "afterH2Text" must be EXACTLY one of the provided section titles (case-sensitive), or null to place the image after the introduction paragraph.
- Distribute images evenly: put one near the start (null or first section), others in middle and later sections.
- If there are no sections, all afterH2Text values must be null.`,
    },
    {
      role: 'user',
      content: `Article title: "${articleTitle}"\n\nSections:\n${sectionsList}`,
    },
  ];

  const raw = await chatCompletion(messages, { temperature: 0.7 });
  const parsed = parseJSONResponse(raw);
  if (!Array.isArray(parsed)) throw new Error('Formato de plano de imagens inválido.');
  return parsed;
}
