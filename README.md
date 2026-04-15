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

## Arquitetura

O projeto segue uma abordagem híbrida: as camadas técnicas (services, store, hooks, utils) ficam separadas por responsabilidade, enquanto os **componentes** e as **rotas** são agrupados por domínio/feature.

```
src/
├── hooks.server.ts   # Auth guard — intercepta toda requisição
├── components/       # Componentes Svelte, organizados por domínio/feature
├── routes/           # Páginas e layouts (filesystem router do SvelteKit)
├── services/         # Chamadas HTTP e implementações mock
├── store/            # Estado global reativo (Svelte Stores)
├── hooks/            # Lógica reativa reutilizável (composables)
├── utils/            # Funções puras utilitárias
├── types/            # Interfaces TypeScript compartilhadas
└── lib/              # Módulo $lib do SvelteKit
```

---

## O que mora em cada pasta

### `components/`
Componentes Svelte (`.svelte`) organizados por domínio. Cada subpasta agrupa componentes de uma feature específica. Componentes genéricos e reutilizáveis ficam em `ui/`. Componentes de estrutura da página ficam em `layout/`.

### `routes/`
Rotas do filesystem router do SvelteKit. Cada pasta vira uma rota no app. O group `(app)` compartilha o layout autenticado sem afetar a URL. Arquivos `+page.svelte` são páginas; `+layout.svelte` são layouts; `+page.server.ts` são server load functions.

### `services/`
Camada de acesso a dados. Cada serviço encapsula chamadas HTTP para um domínio da API. Todos usam o cliente centralizado `api.ts`, que cuida de headers, token e tratamento de erros.


### `store/`
Estado global da aplicação usando Svelte Stores (`writable`, `derived`). Cada store gerencia um slice de estado do domínio. Importados diretamente nos componentes com `$store`.


### `hooks/`
Funções reativas reutilizáveis que encapsulam lógica com side-effects (câmera, geolocalização, timers). Retornam stores ou callbacks. Equivalente ao padrão "composable".

### `utils/`
Funções puras sem dependências de framework. Formatadores, validadores, parsers, constantes. Não devem importar stores ou componentes.


### `lib/`
Pasta especial do SvelteKit acessível via `$lib`. Funciona como ponto central de re-exports para simplificar imports internos.

---

## Roteamento no SvelteKit

O SvelteKit usa **filesystem routing**: a estrutura de pastas dentro de `src/routes/` define as URLs da aplicação. Não há arquivo de rotas centralizado.

### Arquivos especiais de rota

| Arquivo              | Papel                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| `+page.svelte`       | Componente da página renderizado na URL correspondente                |
| `+layout.svelte`     | Layout compartilhado por todas as rotas dentro da mesma pasta         |
| `+page.server.ts`    | Função `load` executada no servidor antes de renderizar a página      |

### Layout groups — `(app)/`

A pasta `(app)/` é um **layout group**: agrupa rotas que compartilham o mesmo `+layout.svelte` (sidebar + AppShell) sem que o nome do grupo apareça na URL. Assim `/admin/dashboard` funciona normalmente, sem `/app/admin/dashboard`.

### Guard de rotas — `hooks.server.ts`

O arquivo `hooks.server.ts` intercepta **toda** requisição antes de chegar à rota. É aqui que a proteção acontece:

```
Requisição chega
  │
  ├─ pathname começa com /auth → deixa passar (rota pública)
  │
  ├─ sem cookie auth_token → redirect 303 /auth/login
  │
  ├─ token presente + role colaborador em /admin/* → redirect 303 /colaborador/registro
  │
  └─ token válido → popula event.locals.user → resolve(event)
```

O `event.locals.user` preenchido pelo hook fica disponível em qualquer `+page.server.ts` via `event.locals`, permitindo carregar dados personalizados por usuário no servidor.

---

## Componentização

- Utilização de Runas do Svelte 5

| Rune          | Função                                               |
| ------------- | ---------------------------------------------------- |
| `$props()`    | Declara as propriedades recebidas pelo componente    |
| `$state()`    | Cria estado local reativo                            |
| `$derived`    | Valor calculado que atualiza automaticamente         |
| `$derived.by` | Versão com função para derivações complexas          |

- Utilziação de Barrel export


---

## Funcionamento Interno

### Como as camadas se comunicam

```
Componente Svelte
  │  chama authService.login()
  ▼
Service (auth.service.ts)
  │    valida os dados de login
  │    retorna um token
  │
  ▼
Componente salva o token
  │
  ▼
Atualiza o estado global
  │
  ▼
Verifica se é admin
  │
  ▼
Exibe o menu
```

### Dados Mockados

Por enquanto não há backend disponível, então os serviços estão exportando implementações mockadas.

```
VITE_USE_MOCK=true   → services exportam mock (dados e delays simulados)
VITE_USE_MOCK=false  → services exportam implementação real (fetch à API)
```

---

## Path Aliases

| Alias  | Resolve para | Exemplo de uso                             |
| ------ | ------------ | ------------------------------------------ |
| `@/`   | `./src/`     | `import { api } from '@/services/api'`     |
| `$lib` | `./src/lib/` | `import { formatDate } from '$lib'`        |

Configurados em `svelte.config.js` e `vite.config.ts`.

---

## Primeiros passos

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env

# 3. Rodar em modo mock (sem backend)
VITE_USE_MOCK=true npm run dev

# 4. Verificar tipos e lint
npm run check
npm run lint
```

### Credenciais de teste

| Usuário              | Identificador       | Senha    | Papel        |
| -------------------- | ------------------- | -------- | ------------ |
| Admin                | admin@teste.com     | Senha123 | admin        |
| Admin (CPF)          | 123.456.789-00      | Senha123 | admin        |
| Carlos Souza         | carlos@teste.com    | Senha123 | colaborador  |
| Carlos Souza (CPF)   | 111.444.777-35      | Senha123 | colaborador  |
| Teste                | teste@teste.com     | Senha123 | colaborador  |

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
