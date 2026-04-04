Atue como um Arquiteto de Software Sênior. Considere que estou iniciando um projeto utilizando o framework Svelte/SvelteKit.
Projeto de gestão de ponto, aonde tem um admin e os colaboradores. O colaborador deve registrar o ponto lendo um qr code ou manual (login e senha).
O admin cria o acesso dos colaboradores, define jornadas de trabalho e tem acesso a um dashboard informativo.
Com base nas boas práticas de arquitetura moderna, crie a estrutura de pastas inicial dentro de src/ seguindo o modelo [Layer-Based OU
Feature-Based].
Requisitos da estrutura:
1. Crie as pastas principais: components, pages, services, hooks, store e utils.
2. Dentro de cada pasta, crie um arquivo .gitkeep (se a pasta estiver vazia) ou um arquivo de exemplo (ex: um api.js básico em
services).
3. Configure um exemplo de 'Path Alias' no arquivo de configuração do projeto (ex: vite.config.js ou tsconfig.json) para que eu possa usar
@/ para referenciar a pasta src.
4. Crie um arquivo README.md na raiz com uma breve explicação do que deve morar em cada pasta desta arquitetura.
5. Certifique-se de que as convenções de nomenclatura sigam o padrão do framework (ex: PascalCase para componentes)

---

Atue como um Desenvolvedor Frontend Sênior especializado em SvelteKit + Svelte 5 + TypeScript.
                                                                                                                                                                                                                                                              
  ## Contexto do Projeto
                                                                                                                                                                                                                                                              
  O projeto "Ponto Digital" é um sistema de gestão de ponto eletrônico.                                                                                                                                                                                       
  - Stack: SvelteKit, Svelte 5 (runes: $state, $props, $derived), TypeScript strict
  - Arquitetura: Hybrid (Layer + Feature)                                                                                                                                                                                                                     
  - Path alias: `@/` → `./src/` (configurado em svelte.config.js via kit.alias)                                                                                                                                                                               
  - Ainda não existe backend — precisamos mockar os services                                                                                                                                                                                                  
                                                                                                                                                                                                                                                              
  ## Convenções obrigatórias                                                                                                                                                                                                                                  
                                                        
  - Componentes: PascalCase.svelte                                                                                                                                                                                                                            
  - Services: nome.service.ts                           
  - Stores: nome.store.ts                                                                                                                                                                                                                                     
  - Hooks: useCamelCase.ts
  - Utils: camelCase.ts                                                                                                                                                                                                                                       
  - Tipagem explícita em todas as funções (parâmetros e retorno)
  - Sem `any` — usar tipos específicos ou generics                                                                                                                                                                                                            
  - Funções pequenas com responsabilidade única (máx ~20 linhas)                                                                                                                                                                                              
  - Nomes descritivos em inglês para código, comentários em português quando necessário                                                                                                                                                                       
  - Separação clara de responsabilidades: pages não fazem lógica de negócio, services não conhecem UI                                                                                                                                                         
  - Imports com path alias `@/` (ex: `import { authService } from '@/services/auth.service'`)                                                                                                                                                                 
                                                                                                                                                                                                                                                              
  ## O que implementar (nesta ordem)                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                              
  ### 1. Mock dos Services                                                                                                                                                                                                                                    
                                                        
  Criar `src/services/mock/` com:

  - `data.ts` — dados fake centralizados. Criar 2 usuários (1 admin, 1 colaborador) e registros de ponto de ~5 dias. Reutilizar os tipos já existentes em `auth.service.ts` (`AuthResponse`, `LoginCredentials`) e `timesheet.service.ts` (`PunchRecord`,     
  `DailySummary`, `PunchType`).
                                                                                                                                                                                                                                                              
  - `auth.mock.ts` — implementação mock do `authService` com a mesma interface exportada em `auth.service.ts`. O login deve validar email+senha contra os dados fake. Usar um token fake (base64 do JSON do user).                                            
   
  - `timesheet.mock.ts` — implementação mock do `timesheetService` com a mesma interface exportada em `timesheet.service.ts`.                                                                                                                                 
                                                        
  Depois, modificar `auth.service.ts` e `timesheet.service.ts` para exportar os mocks quando `VITE_USE_MOCK === 'true'` (ou quando `VITE_API_URL` não estiver definida). A troca deve ser transparente — quem importa o service não precisa saber se é mock ou
   real.
                                                                                                                                                                                                                                                              
  Adicionar `VITE_USE_MOCK=true` no `.env.example` e no `.env`.                                                                                                                                                                                               
  
  ### 2. Rota raiz (`/`)                                                                                                                                                                                                                                      
                                                        
  Criar `src/routes/+page.server.ts` que redireciona:
  - Não autenticado → `/auth/login`
  - Admin → `/admin/dashboard`                                                                                                                                                                                                                                
  - Colaborador → `/colaborador/registro`
                                                                                                                                                                                                                                                              
  Usar `event.locals.user` que já é populado pelo `hooks.server.ts`.

  ### 3. Completar hooks.server.ts                                                                                                                                                                                                                            
  
  Resolver o TODO: popular `event.locals.user` a partir do cookie `auth_token`.                                                                                                                                                                               
  Em modo mock, o token é um JSON em base64 — decodificar e popular locals.
  Manter a estrutura de proteção de rotas que já existe.                                                                                                                                                                                                      
                                                                                                                                                                                                                                                              
  ### 4. Completar a página de login                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                              
  Modificar `src/routes/auth/login/+page.svelte`:                                                                                                                                                                                                             
  - Conectar o form ao `authService.login()`
  - Em caso de sucesso: salvar token no localStorage E como cookie (para o server hook ler), atualizar auth store com `setUser()`, redirecionar com `goto()` baseado no role                                                                                  
  - Em caso de erro: exibir mensagem no errorMsg já existente                                                                                                                                                                                                 
  - Usar os validators de `@/utils/validators` para validação client-side                                                                                                                                                                                     
                                                                                                                                                                                                                                                              
  ## Restrições                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                              
  - NÃO criar arquivos que não foram mencionados                                                                                                                                                                                                              
  - NÃO modificar componentes existentes (Button, AppShell)
  - NÃO instalar dependências novas                                                                                                                                                                                                                           
  - NÃO adicionar comentários óbvios — o código deve ser autoexplicativo
  - Manter compatibilidade com os tipos já definidos em `app.d.ts`, `auth.store.ts`, `auth.service.ts` e `timesheet.service.ts`                                                                                                                               
                                                                                                                                                                                                                                                              
  ## Verificação                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                              
  Ao final, rodar:                                                                                                                                                                                                                                            
  1. `npm run check` — deve passar com 0 erros
  2. `npm run dev` → `/` redireciona para `/auth/login`                                                                                                                                                                                                       
  3. Login com credenciais mock funciona e redireciona corretamente                                                                                                                                                                                           
  4. Rota protegida sem login redireciona para `/auth/login`