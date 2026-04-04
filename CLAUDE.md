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

## Mock System

No backend exists yet. Services use a mock flag to swap implementations:

```
VITE_USE_MOCK=true   → services export mock (dados fake)
VITE_USE_MOCK=false   → services export real (fetch to API)
```

- Mock data in `src/services/mock/data.ts` (2 users, punch history)
- Mock token is base64-encoded JSON of user object (not JWT)
- `hooks.server.ts` decodes this token to populate `event.locals.user`
- Test credentials: `ana@empresa.com` / `Senha123` (admin), `carlos@empresa.com` / `Senha123` (colaborador)

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

## Language

The project documentation, comments, and commit messages are in **Brazilian Portuguese**.
