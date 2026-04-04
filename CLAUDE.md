# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ponto Digital** — sistema de gestão de ponto eletrônico (time clock management) built with SvelteKit + Svelte 5 + TypeScript. Two user roles: `admin` (manages employees and work schedules, views dashboard) and `colaborador` (clocks in/out via QR code or manual login).

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
```

No `package.json` exists at root — the project was scaffolded and dependencies are in `node_modules` via `package-lock.json`. If deps need reinstalling, the project may need a `package.json` recreated from the lock file.

## Architecture

Hybrid Layer + Feature architecture:

- **`src/services/`** — HTTP layer. All API calls go through `api.ts` (centralized fetch client with auth token injection and 401 redirect). Domain services (`auth.service.ts`, `timesheet.service.ts`) use this client.
- **`src/store/`** — Global state via Svelte writable/derived stores. `auth.store.ts` holds the current user, `isAuthenticated`, and `isAdmin` derived stores.
- **`src/hooks/`** — Reusable composables with side-effects (e.g., `useQrScanner.ts` for camera/QR).
- **`src/utils/`** — Pure functions only (no framework imports). Formatters, validators.
- **`src/components/`** — Svelte components organized by feature domain (`ui/`, `auth/`, `dashboard/`, `timesheet/`, `layout/`).
- **`src/routes/`** — SvelteKit filesystem router. `auth/` is public; `(app)/` is the authenticated layout group (URL-transparent). Admin routes under `(app)/admin/`, employee routes under `(app)/colaborador/`.

## Path Aliases

| Alias  | Resolves to | Configured in |
|--------|-------------|---------------|
| `@/`   | `./src/`    | `vite.config.ts` + `tsconfig.json` |
| `$lib` | `./src/lib/`| SvelteKit built-in |

## Naming Conventions

- Components: `PascalCase.svelte`
- Services: `name.service.ts`
- Stores: `name.store.ts`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts` or `kebab-case.ts`
- Routes: `kebab-case/` directories

## Key Patterns

- Auth token stored in `localStorage` as `auth_token`; the `api.ts` client auto-attaches it as a Bearer header.
- On 401 response, `api.ts` clears the token and redirects to `/auth/login`.
- Two user roles defined in `App.Locals` and `auth.store.ts`: `'admin' | 'colaborador'`.
- Environment variables prefixed with `VITE_` (see `.env.example`): `VITE_API_URL`, `VITE_JWT_SECRET`, `VITE_SESSION_COOKIE_NAME`, `VITE_APP_NAME`.

## Language

The project documentation, comments, and commit messages are in **Brazilian Portuguese**.
