# CLAUDE.md

Guia para o Claude Code (claude.ai/code) trabalhar neste repositório.

## Visão Geral

**Ponto Digital** — sistema de gestão de ponto eletrônico em SvelteKit + Svelte 5 + TypeScript. Dois papéis: `admin` (gerencia colaboradores, jornadas e dashboard) e `colaborador` (registra ponto via QR Code ou login manual).

## Comandos

```bash
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção
npm run preview      # preview da build
npm run check        # type-check (svelte-check)
npm run lint         # ESLint
npm run format       # Prettier
npm run db:migrate   # cria/aplica migration (após mudar schema.prisma)
npm run db:seed      # popula admin + 6 colaboradores + 2 jornadas
npm run db:studio    # abre Prisma Studio
npm run db:reset     # reseta DB e roda seed
```

## Arquitetura

Híbrida Camada + Feature:

- **`src/services/`** — camada HTTP. Todas as chamadas passam pelo `api.ts` (fetch centralizado com injeção de token e redirect em 401). Serviços de domínio (`auth.service.ts`, `timesheet.service.ts`) usam esse client.
- **`src/store/`** — estado global via stores do Svelte. `auth.store.ts` mantém o usuário e os derived `isAuthenticated`/`isAdmin`.
- **`src/hooks/`** — composables com efeitos colaterais (ex.: `useQrScanner.ts`).
- **`src/utils/`** — funções puras, sem imports de framework. Formatadores e validadores.
- **`src/components/`** — Svelte components por domínio (`ui/`, `auth/`, `dashboard/`, `timesheet/`, `layout/`, `colaboradores/`).
- **`src/routes/`** — roteador filesystem do SvelteKit. `auth/` é público; `(app)/` é o group autenticado. Admin em `(app)/admin/`, colaborador em `(app)/colaborador/`.
- **`src/lib/server/`** — código exclusivo de servidor (Prisma, TOTP, token, helpers).

### Aliases

| Alias  | Resolve para | Configurado em                   |
| ------ | ------------ | -------------------------------- |
| `@/`   | `./src/`     | `svelte.config.js` (`kit.alias`) |
| `$lib` | `./src/lib/` | built-in do SvelteKit            |

## Persistência (Prisma + PostgreSQL)

- Postgres em container via `docker-compose.yml` (porta 5432, user `ponto`/`ponto`, DB `ponto_digital`). Em produção: `DATABASE_URL` apontando para Postgres gerenciado (Neon/Supabase/Railway).
- Schema em `prisma/schema.prisma` — modelos `Empresa`, `User`, `Jornada`, `Punch`, `Ferias`, `Justificativa`.
- Singleton do client: `src/lib/server/db.ts` (usado em `+server.ts`).
- Senhas com `bcryptjs`. `Jornada.dias` serializada como JSON string (compatibilidade com `src/lib/server/jornada.ts`).
- **Multi-tenancy**: todas as entidades são escopadas por `empresaId`. Admin só enxerga dados da própria empresa.

## Autenticação

- **Token**: Base64(JSON do payload do usuário, incluindo `empresaId` e `role`). Codificado/decodificado em `src/lib/server/token.ts`.
- **Persistência client**: gravado em `localStorage` (para `api.ts`) e `document.cookie` (para `hooks.server.ts`).
- **Servidor**: `hooks.server.ts` lê o cookie, decodifica via `token.ts` e popula `event.locals.user` (com `empresaId`). Helpers em `src/routes/api/_lib/auth-helpers.ts`.
- **Proteção de rotas**: sem token → `/auth/login`; colaborador em `/admin/*` → `/colaborador/registro`. Raiz `/` redireciona por papel em `+page.server.ts`.

## QR Code (TOTP)

- Cada empresa tem um `qrSecret` base32 no DB.
- `src/lib/server/totp.ts` (`otplib`) gera tokens de 6 dígitos, passo 30s, janela ±1.
- Admin vê o QR rotativo em `/admin/empresa` (polling 30s).
- Colaborador registra ponto via `POST /api/timesheet/punch/qr` com `{ empresaId, token, type }`.

## Setup em nova máquina

```bash
docker compose up -d postgres   # sobe Postgres
npm install                     # também roda prisma generate (postinstall) e ativa husky (prepare)
npm run db:migrate              # aplica migrations
npm run db:seed                 # popula dados de teste
```

Volume nomeado `postgres_data` (não polui o repo). `.gitattributes` força `eol=lf`. `postinstall: prisma generate` garante o binário nativo por plataforma (Windows/Linux).

**Credenciais de seed** (senha `Senha123` para todos):

- `admin@teste.com` — admin
- `carlos@teste.com`, `ana@teste.com` — colaboradores

## Qualidade de Código

- **Pre-commit hook** ativo via `husky` + `lint-staged`: ao commitar, roda `eslint --fix` e `prettier --write` somente nos arquivos staged. Configuração em [.husky/pre-commit](.husky/pre-commit) e bloco `lint-staged` no `package.json`.
- Em colaborações onde lint já é validado pelo hook, não é necessário rodar `npm run lint` manualmente antes de cada edit — o hook é a rede de segurança.

## Convenções

- **Svelte 5 runes**: `$state`, `$derived`, `$derived.by()`, `$props()` — nunca `export let` legado.
- **Nomenclatura**:
  - Components: `PascalCase.svelte`
  - Services: `name.service.ts`
  - Stores: `name.store.ts`
  - Hooks: `useCamelCase.ts`
  - Utils: `camelCase.ts` ou `kebab-case.ts`
  - Rotas: diretórios `kebab-case/`
- **Papéis**: `'admin' | 'colaborador'` (definidos em `App.Locals` e `auth.store.ts`).
- **Variáveis de ambiente**: prefixo `VITE_` (ver `.env.example`).
- **Tipografia**: DM Sans (variable font) em `static/fonts/`, declarada via `@font-face` em `src/app.css`.
- **Idioma**: documentação, comentários e commits em português do Brasil.
