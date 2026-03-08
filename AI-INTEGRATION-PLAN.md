# 🤖 Integração com IA — Delícias Culinárias

## Visão Geral
Integração com APIs de LLM (OpenAI e OpenRouter) para:
- **Gerar receitas do zero** com IA a partir de um prompt
- **Traduzir conteúdo** entre idiomas (PT ↔ EN ↔ ES) com IA
- **Gerar artigos de blog** com IA
- **Página de configuração** para API keys e modelos de cada provedor

---

## Arquitetura

```
┌──────────────────────────────────────────────────────┐
│                   Frontend (React)                    │
│                                                       │
│  AISettingsPage ←→ aiConfig.js (localStorage)         │
│  RecipeEditor   ←→ useAI.js hook ←→ aiService.js     │
│  BlogEditor     ←→ useAI.js hook ←→ aiService.js     │
│                                                       │
│  aiService.js → fetch('/api/ai/openai/...')            │
│              → fetch('/api/ai/openrouter/...')          │
└───────────────────────┬──────────────────────────────┘
                        │ Vite Proxy (dev) / Nginx (prod)
                        ▼
          ┌──────────────────────────────┐
          │  https://api.openai.com      │
          │  https://openrouter.ai/api   │
          └──────────────────────────────┘
```

**Segurança:**
- API keys armazenadas no `localStorage` do browser (acesso apenas admin autenticado)
- Proxy no Vite para evitar CORS em desenvolvimento
- Keys enviadas como `Authorization` header (nunca expostas em URLs)
- Em produção: proxy via Nginx reverse proxy ou PocketBase hooks

---

## Fases de Implementação

### Fase 1 — Infraestrutura Base
- [x] 1.1 Criar `src/lib/aiConfig.js` — gerenciamento de configuração (localStorage)
  - Salvar/ler API keys (OpenAI, OpenRouter)
  - Salvar/ler modelos preferidos de cada provedor
  - Salvar/ler provedor ativo (openai ou openrouter)
  - Encapsular acesso seguro com funções tipadas
- [x] 1.2 Criar `src/lib/aiService.js` — camada de serviço de IA
  - Classe unificada que abstrai OpenAI e OpenRouter
  - Método `generateRecipe(prompt, lang)` → retorna objeto com campos da receita
  - Método `translateRecipe(recipe, fromLang, toLang)` → retorna receita traduzida
  - Método `generateBlogArticle(prompt, lang)` → retorna artigo
  - Método `translateText(text, fromLang, toLang)` → traduz texto simples
  - Método `translateBlogArticle(article, fromLang, toLang)` → traduz artigo inteiro
  - Retry com backoff exponencial para erros 429 (rate limit)
  - Streaming parcial (opcional, fase futura)
- [x] 1.3 Criar `src/hooks/useAI.js` — React hook
  - Estado de loading, erro, resultado
  - Funções wrappadas do aiService com toast de feedback
  - Verificação de configuração antes de chamar a API

### Fase 2 — Página de Configuração
- [x] 2.1 Criar `src/pages/admin/AISettingsPage.jsx`
  - Card para OpenAI: campo de API key (password), seletor de modelo
  - Card para OpenRouter: campo de API key (password), seletor de modelo
  - Seletor de provedor ativo (OpenAI ou OpenRouter)
  - Botão "Testar Conexão" para cada provedor
  - Feedback visual (toast) ao guardar configurações
  - Aviso de segurança sobre armazenamento local
- [x] 2.2 Adicionar rota `/admin/ai-settings` em `App.jsx`
- [x] 2.3 Adicionar link "Configurar IA" no `AdminDashboard.jsx`

### Fase 3 — Proxy Vite para APIs Externas
- [x] 3.1 Adicionar proxy `/api/ai/openai` → `https://api.openai.com` no `vite.config.js`
- [x] 3.2 Adicionar proxy `/api/ai/openrouter` → `https://openrouter.ai/api` no `vite.config.js`
- [x] 3.3 Configurar headers e rewrite de path no proxy

### Fase 4 — Integrar IA no Editor de Receitas
- [x] 4.1 Adicionar botão "🤖 Gerar com IA" na top bar do `RecipeEditor.jsx`
  - Abre modal/drawer com campo de prompt
  - Ex: "Receita de sandes de frango grelhado com molho de mostarda"
  - Preenche todos os campos do formulário automaticamente (PT)
- [x] 4.2 Adicionar botão "🌐 Traduzir com IA" nas tabs de idioma
  - Aparece quando o idioma ativo (EN/ES) está vazio mas o PT tem conteúdo
  - Traduz título, descrição, ingredientes e instruções do PT → idioma ativo
  - Loading spinner inline durante tradução
- [x] 4.3 Adicionar botão "🌐 Traduzir Tudo" na top bar
  - Traduz PT → EN e PT → ES de uma vez

### Fase 5 — Integrar IA no Editor de Blog
- [x] 5.1 Adicionar botão "🤖 Gerar com IA" no `BlogArticleEditor.jsx`
  - Prompt para gerar artigo completo em Markdown
  - Preenche título, descrição e conteúdo (PT)
- [x] 5.2 Adicionar botão "🌐 Traduzir com IA" nas tabs de idioma
  - Traduz título, descrição e conteúdo markdown do PT → idioma ativo
- [x] 5.3 Adicionar botão "🌐 Traduzir Tudo" na top bar

### Fase 6 — Refinamento e UX
- [x] 6.1 Modal de geração com IA com textarea e exemplos de prompts
- [x] 6.2 Indicadores de progresso durante operações de IA
- [x] 6.3 Confirmação antes de sobrescrever campos que já possuem conteúdo
- [x] 6.4 Mensagens de erro claras (API key inválida, modelo indisponível, etc.)

---

## Modelos Sugeridos

### OpenAI
| Modelo | Uso Recomendado | Custo |
|--------|----------------|-------|
| `gpt-4o` | Melhor qualidade, receitas complexas | $$ |
| `gpt-4o-mini` | Bom equilíbrio custo/qualidade | $ |
| `gpt-3.5-turbo` | Econômico para traduções simples | ¢ |

### OpenRouter
| Modelo | Uso Recomendado | Custo |
|--------|----------------|-------|
| `anthropic/claude-sonnet-4` | Excelente em texto criativo | $$ |
| `google/gemini-2.0-flash-001` | Rápido e econômico | $ |
| `meta-llama/llama-3.1-70b-instruct` | Open source, gratuito* | Free* |
| `mistralai/mixtral-8x7b-instruct` | Bom em multilíngue | $ |

---

## Ficheiros Criados / Modificados

| Ficheiro | Ação | Descrição |
|----------|------|-----------|
| `src/lib/aiConfig.js` | **Novo** | Gerenciamento de config IA no localStorage |
| `src/lib/aiService.js` | **Novo** | Serviço unificado OpenAI + OpenRouter |
| `src/hooks/useAI.js` | **Novo** | React hook para operações de IA |
| `src/pages/admin/AISettingsPage.jsx` | **Novo** | Página de configuração de IA |
| `src/components/admin/AIGenerateModal.jsx` | **Novo** | Modal de geração com prompt |
| `vite.config.js` | **Modificado** | Proxy para APIs de IA |
| `App.jsx` | **Modificado** | Nova rota `/admin/ai-settings` |
| `AdminDashboard.jsx` | **Modificado** | Link para AI Settings |
| `RecipeEditor.jsx` | **Modificado** | Botões de IA integrados |
| `BlogArticleEditor.jsx` | **Modificado** | Botões de IA integrados |

---

## Notas de Segurança

1. **API keys no localStorage**: Aceitável para projeto pessoal com acesso admin autenticado. Em produção enterprise, usar variáveis de ambiente server-side.
2. **Proxy CORS**: O Vite proxy previne exposure de keys em logs de rede do browser.
3. **Rate limiting**: O aiService implementa retry com backoff para evitar bloqueio.
4. **Sem dados de usuários**: Nenhum dado de visitante é enviado para APIs de IA — apenas conteúdo editorial.
