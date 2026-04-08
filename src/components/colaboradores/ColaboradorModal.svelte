<!-- src/components/colaboradores/ColaboradorModal.svelte -->
<script lang="ts">
  import type { Colaborador, ColaboradorFormData, StatusColaborador } from '../../types/colaborador';

  interface Props {
    aberto: boolean;
    colaborador?: Colaborador | null;
    onFechar: () => void;
    onSalvar: (dados: ColaboradorFormData) => void;
  }

  let { aberto, colaborador = null, onFechar, onSalvar }: Props = $props();

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
    telefone: ''
  });

  let erros = $state<Partial<Record<keyof ColaboradorFormData, string>>>({});

  // Preenche o form quando o colaborador muda (edição)
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
        telefone: colaborador.telefone ?? ''
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
        telefone: ''
      };
    }
    erros = {};
  });

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
</script>

{#if aberto}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={handleBackdropClick}>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <header class="modal-header">
        <h2 id="modal-titulo">{colaborador ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
        <button class="btn-fechar" onclick={onFechar} aria-label="Fechar modal">✕</button>
      </header>

      <div class="modal-body">
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
            />
            {#if erros.nome}<span class="msg-erro">{erros.nome}</span>{/if}
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
            />
            {#if erros.email}<span class="msg-erro">{erros.email}</span>{/if}
          </div>

          <!-- CPF -->
          <div class="campo">
            <label for="cpf">CPF *</label>
            <input
              id="cpf"
              type="text"
              bind:value={form.cpf}
              class:erro={!!erros.cpf}
              placeholder="000.000.000-00"
            />
            {#if erros.cpf}<span class="msg-erro">{erros.cpf}</span>{/if}
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
            />
            {#if erros.cargo}<span class="msg-erro">{erros.cargo}</span>{/if}
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
            />
            {#if erros.departamento}<span class="msg-erro">{erros.departamento}</span>{/if}
          </div>

          <!-- Data de admissão -->
          <div class="campo">
            <label for="dataAdmissao">Data de admissão *</label>
            <input
              id="dataAdmissao"
              type="date"
              bind:value={form.dataAdmissao}
              class:erro={!!erros.dataAdmissao}
            />
            {#if erros.dataAdmissao}<span class="msg-erro">{erros.dataAdmissao}</span>{/if}
          </div>

          <!-- Status -->
          <div class="campo">
            <label for="status">Status</label>
            <select id="status" bind:value={form.status}>
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
              bind:value={form.telefone}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
      </div>

      <footer class="modal-footer">
        <button class="btn btn--secundario" onclick={onFechar}>Cancelar</button>
        <button class="btn btn--primario" onclick={handleSubmit}>
          {colaborador ? 'Salvar alterações' : 'Criar colaborador'}
        </button>
      </footer>
    </div>
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

  .modal-body {
    padding: 1.5rem;
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
  select.erro {
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
