# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ponto Digital** — sistema de gestão de ponto eletrônico (time clock management) built with SvelteKit + Svelte 5 + TypeScript. Two user roles: `admin` (manages employees and work schedules, views dashboard) and `colaborador` (clocks in/out via QR code or manual login).

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # Type-check with svelte-check
npm run lint         # ESLint
npm run format       # Prettier
```

## Architecture

Hybrid Layer + Feature architecture:

- **`src/services/`** — HTTP layer. All API calls go through `api.ts` (centralized fetch client with auth token injection and 401 redirect). Domain services (`auth.service.ts`, `timesheet.service.ts`) use this client.
- **`src/services/mock/`** — Mock implementations of services for frontend development without backend. Activated via `VITE_USE_MOCK=true`. Each service file checks the flag and exports mock or real implementation transparently.
- **`src/store/`** — Global state via Svelte writable/derived stores. `auth.store.ts` holds the current user, `isAuthenticated`, and `isAdmin` derived stores.
- **`src/hooks/`** — Reusable composables with side-effects (e.g., `useQrScanner.ts` for camera/QR).
- **`src/utils/`** — Pure functions only (no framework imports). Formatters, validators.
- **`src/components/`** — Svelte components organized by feature domain (`ui/`, `auth/`, `dashboard/`, `timesheet/`, `layout/`).
- **`src/routes/`** — SvelteKit filesystem router. `auth/` is public; `(app)/` is the authenticated layout group (URL-transparent). Admin routes under `(app)/admin/`, employee routes under `(app)/colaborador/`.

## Path Aliases

| Alias  | Resolves to | Configured in |
|--------|-------------|---------------|
| `@/`   | `./src/`    | `svelte.config.js` (`kit.alias`) |
| `$lib` | `./src/lib/`| SvelteKit built-in |

## Persistência (Prisma + SQLite)

O projeto usa **Prisma** com **SQLite** para persistência local.

- Schema: `prisma/schema.prisma` — modelos `User`, `Jornada`, `Punch`
- DB local: `prisma/dev.db` (git-ignored, gerado por desenvolvedor)
- Singleton: `src/lib/server/db.ts` exporta `prisma` para uso em `+server.ts`
- Senhas: armazenadas com `bcryptjs`
- Jornada.dias: serializada como JSON string (limitação do SQLite para Json nativo)

**Setup inicial em nova máquina:**
```bash
npm install          # também roda `prisma generate` (postinstall)
npm run db:migrate   # aplica migrations, cria dev.db
npm run db:seed      # popula admin + 2 colaboradores + 2 jornadas
```

**Scripts úteis:**
- `npm run db:studio` — abre Prisma Studio (UI web para inspecionar dados)
- `npm run db:reset` — reseta DB e roda seed novamente
- `npm run db:migrate` — cria nova migration após alterar `schema.prisma`

**Token de autenticação**: Base64(JSON do payload do usuário). `hooks.server.ts` e `auth-helpers.ts` decodificam via `src/lib/server/token.ts`.

**Credenciais de teste (seed):** `admin@teste.com` (admin), `carlos@teste.com` (colaborador), `ana@teste.com` (colaborador) — senha padrão para todos: `Senha123`.

## Cross-OS (Windows + Linux)

- `prisma/dev.db` no `.gitignore` — cada dev gera o seu
- `.gitattributes` força `eol=lf` para texto (evita churn de CRLF)
- `postinstall: prisma generate` garante o binário nativo correto por plataforma

## Auth Flow

1. Login form calls `authService.login()` → receives `{ token, user }`
2. Token saved to both `localStorage` (for client `api.ts`) and `document.cookie` (for server `hooks.server.ts`)
3. `hooks.server.ts` reads cookie, decodes token, populates `event.locals.user`
4. Route protection: no token → `/auth/login`; colaborador on `/admin/*` → `/colaborador/registro`
5. Root `/` redirects by role via `+page.server.ts`

## Naming Conventions

- Components: `PascalCase.svelte`
- Services: `name.service.ts`
- Stores: `name.store.ts`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts` or `kebab-case.ts`
- Routes: `kebab-case/` directories

## Key Patterns

- Svelte 5 runes: `$state`, `$derived`, `$derived.by()`, `$props()` — not legacy `let` exports
- Two user roles defined in `App.Locals` and `auth.store.ts`: `'admin' | 'colaborador'`
- Environment variables prefixed with `VITE_` (see `.env.example`)

## Tipografia

A fonte **DM Sans** (variable font) é usada globalmente. Arquivos em `static/fonts/`. Definida via `@font-face` em `src/app.css`, importado no root layout (`src/routes/+layout.svelte`).

## Language

The project documentation, comments, and commit messages are in **Brazilian Portuguese**.
