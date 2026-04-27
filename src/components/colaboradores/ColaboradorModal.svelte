<!-- src/components/colaboradores/ColaboradorModal.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Colaborador, ColaboradorFormData, StatusColaborador } from '../../types/colaborador';
  import { jornadaService, type Jornada } from '../../services/jornada.service';

  interface Props {
    aberto: boolean;
    colaborador?: Colaborador | null;
    onFechar: () => void;
    onSalvar: (dados: ColaboradorFormData) => void;
    onExcluir?: () => void;
  }

  let { aberto, colaborador = null, onFechar, onSalvar, onExcluir }: Props = $props();

  const statusOpcoes: { value: StatusColaborador; label: string }[] = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' },
    { value: 'ferias', label: 'Férias' },
    { value: 'afastado', label: 'Afastado' }
  ];

  let form = $state<ColaboradorFormData>({
    nome: '',
    email: '',
    cpf: '',
    cargo: '',
    departamento: '',
    dataAdmissao: '',
    status: 'ativo',
    telefone: '',
    jornadaId: ''
  });

  let erros = $state<Partial<Record<keyof ColaboradorFormData, string>>>({});

  let aba = $state<'dados' | 'jornada'>('dados');
  let jornadas = $state<Jornada[]>([]);
  let carregandoJornadas = $state(false);

  onMount(async () => {
    carregandoJornadas = true;
    try {
      jornadas = await jornadaService.list();
    } catch {
      jornadas = [];
    } finally {
      carregandoJornadas = false;
    }
  });

  $effect(() => {
    if (colaborador) {
      form = {
        nome: colaborador.nome,
        email: colaborador.email,
        cpf: colaborador.cpf,
        cargo: colaborador.cargo,
        departamento: colaborador.departamento,
        dataAdmissao: colaborador.dataAdmissao,
        status: colaborador.status,
        telefone: colaborador.telefone ?? '',
        jornadaId: colaborador.jornadaId ?? ''
      };
    } else {
      form = {
        nome: '',
        email: '',
        cpf: '',
        cargo: '',
        departamento: '',
        dataAdmissao: '',
        status: 'ativo',
        telefone: '',
        jornadaId: ''
      };
    }
    aba = 'dados';
    erros = {};
  });

  function handleCpfInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const raw = input.value;

    if (/[a-zA-Z]/.test(raw)) {
      erros = { ...erros, cpf: 'O CPF deve conter apenas números.' };
    } else {
      const { cpf: _, ...resto } = erros;
      erros = resto;
    }

    form.cpf = raw.replace(/[a-zA-Z]/g, '');
  }

  function handleTelefoneInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const raw = input.value;

    if (/[a-zA-Z]/.test(raw)) {
      erros = { ...erros, telefone: 'O telefone deve conter apenas números.' };
    } else {
      const { telefone: _, ...resto } = erros;
      erros = resto;
    }

    form.telefone = raw.replace(/[a-zA-Z]/g, '');
  }

  function validar(): boolean {
    const novosErros: typeof erros = {};

    if (!form.nome.trim()) novosErros.nome = 'Nome é obrigatório';
    if (!form.email.trim()) novosErros.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      novosErros.email = 'E-mail inválido';
    if (!form.cpf.trim()) novosErros.cpf = 'CPF é obrigatório';
    if (!form.cargo.trim()) novosErros.cargo = 'Cargo é obrigatório';
    if (!form.departamento.trim()) novosErros.departamento = 'Departamento é obrigatório';
    if (!form.dataAdmissao) novosErros.dataAdmissao = 'Data de admissão é obrigatória';
    if (erros.telefone) novosErros.telefone = erros.telefone;

    erros = novosErros;
    return Object.keys(novosErros).length === 0;
  }

  function handleSubmit() {
    if (!validar()) return;
    onSalvar({ ...form });
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onFechar();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onFechar();
  }
</script>

{#if aberto}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={handleBackdropClick}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <form
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      onkeydown={handleKeydown}
    >
      <header class="modal-header">
        <h2 id="modal-titulo">{colaborador ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
        <button type="button" class="btn-fechar" onclick={onFechar} aria-label="Fechar modal">✕</button>
      </header>

      <div class="modal-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'dados'}
          class="modal-tab"
          class:modal-tab--ativa={aba === 'dados'}
          onclick={() => (aba = 'dados')}
        >
          Dados
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'jornada'}
          class="modal-tab"
          class:modal-tab--ativa={aba === 'jornada'}
          onclick={() => (aba = 'jornada')}
        >
          Jornada
        </button>
      </div>

      <div class="modal-body">
        {#if aba === 'dados'}
        <div class="form-grid">

          <!-- Nome -->
          <div class="campo campo--full">
            <label for="nome">Nome completo *</label>
            <input
              id="nome"
              type="text"
              bind:value={form.nome}
              class:erro={!!erros.nome}
              placeholder="Ex: João Silva"
              aria-required="true"
              aria-invalid={!!erros.nome}
              aria-describedby={erros.nome ? 'erro-nome' : undefined}
            />
            {#if erros.nome}
              <span id="erro-nome" class="msg-erro" role="alert">{erros.nome}</span>
            {/if}
          </div>

          <!-- E-mail -->
          <div class="campo">
            <label for="email">E-mail *</label>
            <input
              id="email"
              type="email"
              bind:value={form.email}
              class:erro={!!erros.email}
              placeholder="joao@empresa.com"
              aria-required="true"
              aria-invalid={!!erros.email}
              aria-describedby={erros.email ? 'erro-email' : undefined}
            />
            {#if erros.email}
              <span id="erro-email" class="msg-erro" role="alert">{erros.email}</span>
            {/if}
          </div>

          <!-- CPF -->
          <div class="campo">
            <label for="cpf">CPF *</label>
            <input
              id="cpf"
              type="text"
              value={form.cpf}
              oninput={handleCpfInput}
              class:erro={!!erros.cpf}
              placeholder="000.000.000-00"
              inputmode="numeric"
              aria-required="true"
              aria-invalid={!!erros.cpf}
              aria-describedby={erros.cpf ? 'erro-cpf' : undefined}
            />
            {#if erros.cpf}
              <span id="erro-cpf" class="msg-erro" role="alert">{erros.cpf}</span>
            {/if}
          </div>

          <!-- Cargo -->
          <div class="campo">
            <label for="cargo">Cargo *</label>
            <input
              id="cargo"
              type="text"
              bind:value={form.cargo}
              class:erro={!!erros.cargo}
              placeholder="Ex: Desenvolvedor"
              aria-required="true"
              aria-invalid={!!erros.cargo}
              aria-describedby={erros.cargo ? 'erro-cargo' : undefined}
            />
            {#if erros.cargo}
              <span id="erro-cargo" class="msg-erro" role="alert">{erros.cargo}</span>
            {/if}
          </div>

          <!-- Departamento -->
          <div class="campo">
            <label for="departamento">Departamento *</label>
            <input
              id="departamento"
              type="text"
              bind:value={form.departamento}
              class:erro={!!erros.departamento}
              placeholder="Ex: Tecnologia"
              aria-required="true"
              aria-invalid={!!erros.departamento}
              aria-describedby={erros.departamento ? 'erro-departamento' : undefined}
            />
            {#if erros.departamento}
              <span id="erro-departamento" class="msg-erro" role="alert">{erros.departamento}</span>
            {/if}
          </div>

          <!-- Data de admissão -->
          <div class="campo">
            <label for="dataAdmissao">Data de admissão *</label>
            <input
              id="dataAdmissao"
              type="date"
              bind:value={form.dataAdmissao}
              class:erro={!!erros.dataAdmissao}
              aria-required="true"
              aria-invalid={!!erros.dataAdmissao}
              aria-describedby={erros.dataAdmissao ? 'erro-dataAdmissao' : undefined}
            />
            {#if erros.dataAdmissao}
              <span id="erro-dataAdmissao" class="msg-erro" role="alert">{erros.dataAdmissao}</span>
            {/if}
          </div>

          <!-- Status -->
          <div class="campo">
            <label for="status">Status</label>
            <select id="status" bind:value={form.status} aria-required="true">
              {#each statusOpcoes as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </div>

          <!-- Telefone -->
          <div class="campo">
            <label for="telefone">Telefone</label>
            <input
              id="telefone"
              type="tel"
              value={form.telefone}
              oninput={handleTelefoneInput}
              placeholder="(11) 99999-9999"
              inputmode="numeric"
              class:erro={!!erros.telefone}
              aria-invalid={!!erros.telefone}
              aria-describedby={erros.telefone ? 'erro-telefone' : undefined}
            />
            {#if erros.telefone}
              <span id="erro-telefone" class="msg-erro" role="alert">{erros.telefone}</span>
            {/if}
          </div>

        </div>
        {:else}
        <div class="aba-jornada">
          <div class="campo campo--full">
            <label for="jornadaId">Jornada de trabalho</label>
            {#if carregandoJornadas}
              <p class="aba-jornada__hint">Carregando jornadas…</p>
            {:else if jornadas.length === 0}
              <p class="aba-jornada__hint">
                Nenhuma jornada cadastrada. Cadastre uma em <strong>Jornadas</strong> antes de
                vincular ao colaborador.
              </p>
            {:else}
              <select id="jornadaId" bind:value={form.jornadaId}>
                <option value="">Sem jornada vinculada</option>
                {#each jornadas as j (j.id)}
                  <option value={j.id}>{j.nome}</option>
                {/each}
              </select>
              <p class="aba-jornada__hint">
                Vincule o colaborador a uma jornada existente. A alteração é salva ao clicar em
                <strong>Salvar alterações</strong>.
              </p>
            {/if}
          </div>
        </div>
        {/if}
      </div>

      <footer class="modal-footer">
        {#if colaborador && onExcluir}
          <button type="button" class="btn btn--perigo" onclick={onExcluir}>Excluir</button>
        {/if}
        <button type="button" class="btn btn--secundario" onclick={onFechar}>Cancelar</button>
        <button type="submit" class="btn btn--primario">
          {colaborador ? 'Salvar alterações' : 'Criar colaborador'}
        </button>
      </footer>
    </form>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 1rem;
  }

  .modal {
    background: var(--color-surface, #fff);
    border-radius: 0.75rem;
    width: 100%;
    max-width: 640px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 0;
  }

  .modal-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text, #111);
    margin: 0;
  }

  .btn-fechar {
    background: none;
    border: none;
    font-size: 1.125rem;
    color: var(--color-text-muted, #666);
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
    border-radius: 0.25rem;
    transition: color 0.15s;
  }

  .btn-fechar:hover {
    color: var(--color-text, #111);
  }

  .modal-tabs {
    display: flex;
    gap: 0.25rem;
    padding: 0.5rem 1.5rem 0;
    border-bottom: 1px solid var(--color-border, #e2e8f0);
  }

  .modal-tab {
    background: none;
    border: none;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted, #64748b);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }

  .modal-tab--ativa {
    color: var(--color-primary, #3b82f6);
    border-bottom-color: var(--color-primary, #3b82f6);
  }

  .modal-body {
    padding: 1.5rem;
  }

  .aba-jornada__hint {
    font-size: 0.8125rem;
    color: var(--color-text-muted, #64748b);
    margin: 0.5rem 0 0;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .campo {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .campo--full {
    grid-column: 1 / -1;
  }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text, #111);
  }

  input,
  select {
    padding: 0.625rem 0.75rem;
    border: 1.5px solid var(--color-border, #e2e8f0);
    border-radius: 0.5rem;
    font-size: 0.9rem;
    color: var(--color-text, #111);
    background: var(--color-input-bg, #f8fafc);
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus,
  select:focus {
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: var(--color-surface, #fff);
  }

  input.erro,
  input[aria-invalid='true'] {
    border-color: var(--color-danger, #ef4444);
  }

  .msg-erro {
    font-size: 0.75rem;
    color: var(--color-danger, #ef4444);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem 1.5rem;
    border-top: 1px solid var(--color-border, #e2e8f0);
  }

  .btn--perigo {
    margin-right: auto;
    background: var(--color-danger, #dc2626);
    color: #fff;
  }

  .btn--perigo:hover {
    opacity: 0.9;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    border: none;
  }

  .btn--primario {
    background: var(--color-primary, #3b82f6);
    color: #fff;
  }

  .btn--primario:hover {
    opacity: 0.9;
  }

  .btn--secundario {
    background: var(--color-border, #e2e8f0);
    color: var(--color-text, #111);
  }

  .btn--secundario:hover {
    opacity: 0.8;
  }

  @media (max-width: 480px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>