# Ponto Digital

Sistema de gestão de ponto eletrônico com suporte a leitura de QR Code e registro manual.

---

## Stack

| Camada     | Tecnologia                  |
| ---------- | --------------------------- |
| Framework  | SvelteKit + Svelte 5        |
| Linguagem  | TypeScript                  |
| Build      | Vite                        |
| Estilo     | Scoped CSS (Svelte)         |
| Estado     | Svelte Stores               |

---

## Arquitetura — Hybrid (Layer + Feature)

O projeto segue uma abordagem **híbrida**: as camadas técnicas (services, store, hooks, utils) ficam separadas por responsabilidade, enquanto os **componentes** e as **rotas** são agrupados por domínio/feature.

```
src/
├── app.d.ts                    # Tipos globais do SvelteKit (Locals, PageData)
├── hooks.server.ts             # Server hooks — auth guard, populacão de locals
│
├── components/                 # Componentes Svelte reutilizáveis
│   ├── index.ts                # Barrel file para re-exports
│   ├── ui/                     # Primitivos de UI (Button, Input, Modal, Badge)
│   ├── layout/                 # Estrutura visual (AppShell, Sidebar, Header)
│   ├── auth/                   # Componentes de autenticação (LoginForm, QrReader)
│   ├── dashboard/              # Widgets do dashboard (StatCard, ChartPanel)
│   └── timesheet/              # Componentes de ponto (PunchButton, PunchList)
│
├── routes/                     # Filesystem router do SvelteKit
│   ├── auth/                   # Rotas públicas (não autenticadas)
│   │   ├── login/              # /auth/login  — login por e-mail + senha
│   │   └── qrcode/             # /auth/qrcode — registro de ponto via QR Code
│   └── (app)/                  # Layout group — rotas autenticadas
│       ├── +layout.svelte      # Layout com sidebar (AppShell)
│       ├── admin/              # Rotas do administrador
│       │   ├── dashboard/      # /admin/dashboard   — métricas e visão geral
│       │   ├── colaboradores/  # /admin/colaboradores — CRUD de colaboradores
│       │   └── jornadas/       # /admin/jornadas     — gestão de jornadas
│       └── colaborador/        # Rotas do colaborador
│           ├── registro/       # /colaborador/registro — bater ponto
│           └── historico/      # /colaborador/historico — consultar registros
│
├── services/                   # Camada de comunicação com APIs externas
│   ├── api.ts                  # Cliente HTTP centralizado (fetch + interceptors)
│   ├── auth.service.ts         # Login, logout, validação de sessão
│   └── timesheet.service.ts    # Registro e consulta de pontos
│
├── store/                      # Estado global reativo (Svelte Stores)
│   └── auth.store.ts           # Usuário autenticado, flags isAdmin/isAuth
│
├── hooks/                      # Lógica reativa reutilizável (composables)
│   └── useQrScanner.ts         # Controle de câmera + decodificação de QR Code
│
├── utils/                      # Funções puras utilitárias (sem side-effects)
│   ├── date.ts                 # Formatação e cálculos de data/hora
│   └── validators.ts           # Validações de formulário (email, senha, etc.)
│
└── lib/                        # Módulo $lib do SvelteKit
    └── index.ts                # Re-exports de conveniência
```

---

## O que mora em cada pasta

### `components/`
Componentes Svelte (`.svelte`) organizados por domínio. Cada subpasta agrupa componentes de uma feature específica. Componentes genéricos e reutilizáveis ficam em `ui/`. Componentes de estrutura da página ficam em `layout/`.

**Convenção de nomes:** `PascalCase.svelte` (ex: `Button.svelte`, `AppShell.svelte`).

### `routes/`
Rotas do filesystem router do SvelteKit. Cada pasta vira uma rota no app. O group `(app)` compartilha o layout autenticado sem afetar a URL. Arquivos `+page.svelte` são páginas; `+layout.svelte` são layouts; `+page.server.ts` são server load functions.

### `services/`
Camada de acesso a dados. Cada serviço encapsula chamadas HTTP para um domínio da API. Todos usam o cliente centralizado `api.ts`, que cuida de headers, token e tratamento de erros.

**Convenção de nomes:** `kebab-case.service.ts` (ex: `auth.service.ts`).

### `store/`
Estado global da aplicação usando Svelte Stores (`writable`, `derived`). Cada store gerencia um slice de estado do domínio. Importados diretamente nos componentes com `$store`.

**Convenção de nomes:** `kebab-case.store.ts` (ex: `auth.store.ts`).

### `hooks/`
Funções reativas reutilizáveis que encapsulam lógica com side-effects (câmera, geolocalização, timers). Retornam stores ou callbacks. Equivalente ao padrão "composable".

**Convenção de nomes:** `useCamelCase.ts` (ex: `useQrScanner.ts`).

### `utils/`
Funções puras sem dependências de framework. Formatadores, validadores, parsers, constantes. Não devem importar stores ou componentes.

**Convenção de nomes:** `kebab-case.ts` (ex: `date.ts`, `validators.ts`).

### `lib/`
Pasta especial do SvelteKit acessível via `$lib`. Funciona como ponto central de re-exports para simplificar imports internos.

---

## Path Aliases

| Alias  | Resolve para | Exemplo de uso                             |
| ------ | ------------ | ------------------------------------------ |
| `@/`   | `./src/`     | `import { api } from '@/services/api'`     |
| `$lib` | `./src/lib/` | `import { formatDate } from '$lib'`        |

Configurados em `vite.config.ts` e `tsconfig.json`.

---

## Primeiros passos

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env

# 3. Rodar em dev
npm run dev
```

---

## Convenções

| Item           | Padrão                              |
| -------------- | ----------------------------------- |
| Componentes    | `PascalCase.svelte`                 |
| Serviços       | `nome.service.ts`                   |
| Stores         | `nome.store.ts`                     |
| Hooks          | `useCamelCase.ts`                   |
| Utils          | `camelCase.ts` ou `kebab-case.ts`   |
| Rotas          | `kebab-case/` (padrão SvelteKit)    |
| Variáveis CSS  | `--color-primary`, `--color-danger` |


## Acessos teste

  admin@teste.com: Senha123

  123.456.789-00: Senha123

  carlos@teste.com: Senha123

  111.444.777-35: Senha123