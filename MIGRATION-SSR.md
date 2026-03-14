# Migração para SSR com Vike

## Objetivo
Migrar o site de CSR puro (React SPA) para SSR com **Vike + vike-react**.
O HTML é renderizado no servidor com dados já incluídos — bots recebem conteúdo completo sem depender de JS.
Admin continua como SPA (sem SSR).

## Arquitetura alvo

```
Coolify → nginx:80
  → /assets/*           → ficheiros estáticos (cache 1y)
  → /hcgi/platform/*    → PocketBase:8090 (API)
  → /api/ai/*           → OpenAI/OpenRouter proxy
  → /*                  → Node.js SSR:3000 (Vike renderiza HTML)
```

Container: supervisord gere **nginx + PocketBase + Node.js SSR** (3 processos)

---

## Fase 0: Setup Vike (bloqueia tudo)

- [x] **Step 1** — Instalar dependências (`vike`, `vike-react`, `express`, `compression`, `sirv`)
- [x] **Step 2** — Criar config Vike (`pages/+config.js`)
- [x] **Step 3** — Atualizar `vite.config.js` (adicionar plugin Vike)
- [x] **Step 4** — Criar servidor SSR (`server/index.js`)
- [x] **Step 5** — Atualizar PocketBase client (URL condicional server/client)

## Fase 1: Layout e Routing (bloqueia Fase 2)

- [x] **Step 6** — Criar layout raiz (`pages/+Layout.jsx`)
- [x] **Step 7** — Criar `pages/+Head.jsx` (defaults globais)
- [x] **Step 8** — Adaptar LanguageProvider para SSR
- [x] **Step 9** — Implementar routing multi-idioma com `+route.js`

## Fase 2: Migrar Páginas Públicas

- [x] **Step 10** — Migrar AboutPage (estática)
- [x] **Step 11** — Migrar ContactPage (formulário)
- [x] **Step 12** — Migrar HomePage (dados: featured recipes + articles)
- [x] **Step 13** — Migrar RecipeListPage (dados + search/filter)
- [x] **Step 14** — Migrar RecipeDetailPage (dados + JSON-LD)
- [x] **Step 15** — Migrar BlogPage (dados + search/filter)
- [x] **Step 16** — Migrar BlogDetailPage (dados + JSON-LD)
- [x] **Step 17** — Migrar NotFoundPage

## Fase 3: Admin (SPA, sem SSR)

- [x] **Step 18** — Criar `pages/admin/+config.js` com `ssr: false`
- [x] **Step 19** — Migrar rotas admin para Vike filesystem routing

## Fase 4: Docker / Infra

- [x] **Step 20** — Atualizar Dockerfile (Node.js runtime + build SSR)
- [x] **Step 21** — Atualizar nginx.conf (proxy para Node.js SSR)
- [x] **Step 22** — Atualizar supervisord.conf (novo processo node-ssr)
- [x] **Step 23** — Atualizar scripts package.json (build + start)

## Fase 5: Cleanup

- [ ] **Step 24** — Remover `main.jsx`, `App.jsx`, `ScrollToTop.jsx`
- [ ] **Step 25** — Remover `react-helmet` das dependências
- [ ] **Step 26** — Remover lazy() imports e PageLoader
- [x] **Step 27** — Testar build completo e verificar SSR

## Verificação Final

- [ ] `curl localhost:3000/pt` retorna HTML com receitas completas
- [ ] `curl localhost:3000/pt/receita/<slug>` retorna HTML com detalhes da receita
- [ ] Hydration funciona (navegação client-side entre páginas)
- [ ] Admin `/admin/dashboard` funciona como SPA
- [ ] `docker compose up --build` inicia sem erros
- [ ] Google Search Console "Testar URL publicada" mostra conteúdo
- [ ] Rich Results Test valida Schema.org
- [ ] OG meta tags presentes no HTML inicial (social sharing)
