<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '@/components/ui/Button.svelte';
  import { jornadaService } from '@/services/jornada.service';
  import type { Jornada, JornadaInput } from '@/services/jornada.service';

  // ── Estado principal ───────────────────────────────────────
  let jornadas = $state<Jornada[]>([]);
  let loading = $state(false);
  let errorMsg = $state('');

  // ── Estado do modal ────────────────────────────────────────
  let modalOpen = $state(false);
  let editingId = $state<string | null>(null);
  let saving = $state(false);
  let deleteConfirmId = $state<string | null>(null);

  // ── Campos do formulário ───────────────────────────────────
  let formNome = $state('');
  let formEntrada = $state('');
  let formSaidaAlmoco = $state('');
  let formRetornoAlmoco = $state('');
  let formSaida = $state('');
  let errors = $state<Record<string, string>>({});

  // ── Helpers ────────────────────────────────────────────────
  function calcMinutes(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return eh * 60 + em - (sh * 60 + sm);
  }

  function formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${String(m).padStart(2, '0')}min`;
  }

  // ── Derivados ──────────────────────────────────────────────
  let jornadasComCalculo = $derived.by(() =>
    jornadas.map((j) => ({
      ...j,
      totalMinutes:
        calcMinutes(j.entrada, j.saida) - calcMinutes(j.saida_almoco, j.retorno_almoco),
      almocoMinutes: calcMinutes(j.saida_almoco, j.retorno_almoco)
    }))
  );

  let previewTotal = $derived.by(() => {
    if (!formEntrada || !formSaidaAlmoco || !formRetornoAlmoco || !formSaida) return null;
    const total =
      calcMinutes(formEntrada, formSaida) - calcMinutes(formSaidaAlmoco, formRetornoAlmoco);
    const almoco = calcMinutes(formSaidaAlmoco, formRetornoAlmoco);
    if (total <= 0 || almoco <= 0) return null;
    return { total, almoco };
  });

  // ── Validação ──────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};

    if (!formNome.trim()) e.nome = 'Nome é obrigatório';
    if (!formEntrada) e.entrada = 'Obrigatório';
    if (!formSaidaAlmoco) e.saida_almoco = 'Obrigatório';
    if (!formRetornoAlmoco) e.retorno_almoco = 'Obrigatório';
    if (!formSaida) e.saida = 'Obrigatório';

    if (formEntrada && formSaidaAlmoco && formRetornoAlmoco && formSaida) {
      const toMin = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const [e1, e2, e3, e4] = [formEntrada, formSaidaAlmoco, formRetornoAlmoco, formSaida].map(
        toMin
      );

      if (e1 >= e2) e.saida_almoco = 'Deve ser depois da entrada';
      if (e2 >= e3) e.retorno_almoco = 'Deve ser depois da saída p/ almoço';
      if (e3 >= e4) e.saida = 'Deve ser depois do retorno do almoço';
    }

    errors = e;
    return Object.keys(e).length === 0;
  }

  // ── Ações CRUD ─────────────────────────────────────────────
  function openCreate() {
    editingId = null;
    formNome = '';
    formEntrada = '';
    formSaidaAlmoco = '';
    formRetornoAlmoco = '';
    formSaida = '';
    errors = {};
    modalOpen = true;
  }

  function openEdit(j: Jornada) {
    editingId = j.id;
    formNome = j.nome;
    formEntrada = j.entrada;
    formSaidaAlmoco = j.saida_almoco;
    formRetornoAlmoco = j.retorno_almoco;
    formSaida = j.saida;
    errors = {};
    modalOpen = true;
  }

  function closeModal() {
    modalOpen = false;
    editingId = null;
  }

  async function handleSave() {
    if (!validate()) return;
    saving = true;
    errorMsg = '';
    const data: JornadaInput = {
      nome: formNome.trim(),
      entrada: formEntrada,
      saida_almoco: formSaidaAlmoco,
      retorno_almoco: formRetornoAlmoco,
      saida: formSaida
    };
    try {
      if (editingId) {
        const updated = await jornadaService.update(editingId, data);
        jornadas = jornadas.map((j) => (j.id === editingId ? updated : j));
      } else {
        const created = await jornadaService.create(data);
        jornadas = [...jornadas, created];
      }
      closeModal();
    } catch {
      errorMsg = 'Erro ao salvar jornada. Tente novamente.';
    } finally {
      saving = false;
    }
  }

  async function handleDelete(id: string) {
    errorMsg = '';
    try {
      await jornadaService.remove(id);
      jornadas = jornadas.filter((j) => j.id !== id);
      deleteConfirmId = null;
    } catch {
      errorMsg = 'Erro ao excluir jornada. Tente novamente.';
    }
  }

  onMount(async () => {
    loading = true;
    try {
      jornadas = await jornadaService.list();
    } catch {
      errorMsg = 'Erro ao carregar jornadas.';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Jornadas — Ponto Digital</title>
</svelte:head>

<section class="jornadas">
  <div class="jornadas__header">
    <h1 class="jornadas__title">Jornadas de Trabalho</h1>
    <Button variant="primary" size="sm" onclick={openCreate}>Nova Jornada</Button>
  </div>

  {#if errorMsg}
    <div class="jornadas__error" role="alert">{errorMsg}</div>
  {/if}

  {#if loading}
    <p class="jornadas__empty">Carregando...</p>
  {:else if jornadasComCalculo.length === 0}
    <p class="jornadas__empty">Nenhuma jornada cadastrada.</p>
  {:else}
    <div class="jornadas__grid">
      {#each jornadasComCalculo as j (j.id)}
        <div class="jornada-card">
          <div class="jornada-card__header">
            <span class="jornada-card__nome">{j.nome}</span>
            <div class="jornada-card__actions">
              <Button variant="outline" size="sm" onclick={() => openEdit(j)}>Editar</Button>
              {#if deleteConfirmId === j.id}
                <Button variant="danger" size="sm" onclick={() => handleDelete(j.id)}
                  >Confirmar</Button
                >
                <Button variant="secondary" size="sm" onclick={() => (deleteConfirmId = null)}
                  >Cancelar</Button
                >
              {:else}
                <Button variant="danger" size="sm" onclick={() => (deleteConfirmId = j.id)}
                  >Excluir</Button
                >
              {/if}
            </div>
          </div>

          <div class="jornada-card__times">
            <div class="time-slot">
              <span class="time-slot__label">Entrada</span>
              <span class="time-slot__value">{j.entrada}</span>
            </div>
            <div class="time-slot">
              <span class="time-slot__label">Saída Almoço</span>
              <span class="time-slot__value">{j.saida_almoco}</span>
            </div>
            <div class="time-slot">
              <span class="time-slot__label">Retorno</span>
              <span class="time-slot__value">{j.retorno_almoco}</span>
            </div>
            <div class="time-slot">
              <span class="time-slot__label">Saída</span>
              <span class="time-slot__value">{j.saida}</span>
            </div>
          </div>

          <div class="jornada-card__footer">
            <span class="badge badge--blue">{formatMinutes(j.totalMinutes)} trabalhadas</span>
            <span class="badge badge--muted">{formatMinutes(j.almocoMinutes)} almoço</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</section>

{#if modalOpen}
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label={editingId ? 'Editar jornada' : 'Nova jornada'}
  >
    <div class="modal">
      <div class="modal__header">
        <h2 class="modal__title">{editingId ? 'Editar Jornada' : 'Nova Jornada'}</h2>
        <button class="modal__close" onclick={closeModal} aria-label="Fechar">&times;</button>
      </div>

      <form
        class="modal__form"
        onsubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div class="field" class:field--error={!!errors.nome}>
          <label for="nome">Nome da Jornada</label>
          <input id="nome" type="text" bind:value={formNome} placeholder="Ex: Comercial 8h" />
          {#if errors.nome}<span class="field__error">{errors.nome}</span>{/if}
        </div>

        <div class="time-grid">
          <div class="field" class:field--error={!!errors.entrada}>
            <label for="entrada">Entrada</label>
            <input id="entrada" type="time" bind:value={formEntrada} />
            {#if errors.entrada}<span class="field__error">{errors.entrada}</span>{/if}
          </div>

          <div class="field" class:field--error={!!errors.saida_almoco}>
            <label for="saida_almoco">Saída Almoço</label>
            <input id="saida_almoco" type="time" bind:value={formSaidaAlmoco} />
            {#if errors.saida_almoco}<span class="field__error">{errors.saida_almoco}</span>{/if}
          </div>

          <div class="field" class:field--error={!!errors.retorno_almoco}>
            <label for="retorno_almoco">Retorno Almoço</label>
            <input id="retorno_almoco" type="time" bind:value={formRetornoAlmoco} />
            {#if errors.retorno_almoco}
              <span class="field__error">{errors.retorno_almoco}</span>
            {/if}
          </div>

          <div class="field" class:field--error={!!errors.saida}>
            <label for="saida">Saída</label>
            <input id="saida" type="time" bind:value={formSaida} />
            {#if errors.saida}<span class="field__error">{errors.saida}</span>{/if}
          </div>
        </div>

        {#if previewTotal}
          <div class="modal__preview">
            <span>Total: <strong>{formatMinutes(previewTotal.total)}</strong></span>
            <span>Almoço: <strong>{formatMinutes(previewTotal.almoco)}</strong></span>
          </div>
        {/if}

        <div class="modal__footer">
          <Button variant="outline" onclick={closeModal}>Cancelar</Button>
          <Button variant="primary" type="submit" loading={saving}>
            {editingId ? 'Salvar Alterações' : 'Criar Jornada'}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  /* ── Página ─────────────────────────────────────────────── */
  .jornadas {
    padding: 2rem;
    max-width: 1100px;
  }

  .jornadas__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .jornadas__title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
  }

  .jornadas__error {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .jornadas__empty {
    text-align: center;
    color: #94a3b8;
    padding: 4rem 2rem;
  }

  /* ── Grid de cards ──────────────────────────────────────── */
  .jornadas__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  /* ── Card ───────────────────────────────────────────────── */
  .jornada-card {
    background: #fff;
    border-radius: 0.75rem;
    padding: 1.25rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .jornada-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .jornada-card__nome {
    font-weight: 700;
    color: #0f172a;
    font-size: 1rem;
    line-height: 1.3;
  }

  .jornada-card__actions {
    display: flex;
    gap: 0.375rem;
    flex-shrink: 0;
  }

  /* ── Horários ───────────────────────────────────────────── */
  .jornada-card__times {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .time-slot {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .time-slot__label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #94a3b8;
  }

  .time-slot__value {
    font-size: 0.9rem;
    font-weight: 600;
    color: #334155;
    font-variant-numeric: tabular-nums;
  }

  /* ── Footer do card ─────────────────────────────────────── */
  .jornada-card__footer {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.625rem;
    border-radius: 999px;
  }

  .badge--blue {
    background: #eff6ff;
    color: #2563eb;
  }

  .badge--muted {
    background: #f1f5f9;
    color: #64748b;
  }

  /* ── Modal ──────────────────────────────────────────────── */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 1rem;
  }

  .modal {
    background: #fff;
    border-radius: 0.75rem;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  }

  .modal__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal__title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #0f172a;
  }

  .modal__close {
    background: none;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    color: #64748b;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
  }

  .modal__close:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  .modal__form {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ── Campos ─────────────────────────────────────────────── */
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .field label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #0f172a;
  }

  .field input {
    border: 1.5px solid #cbd5e1;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    outline: none;
    transition: border-color 150ms;
    color: #0f172a;
    background: #fff;
  }

  .field input:focus {
    border-color: #2563eb;
  }

  .field--error input {
    border-color: #dc2626;
  }

  .field__error {
    font-size: 0.75rem;
    color: #dc2626;
  }

  .time-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  /* ── Preview live ───────────────────────────────────────── */
  .modal__preview {
    display: flex;
    gap: 1.5rem;
    font-size: 0.875rem;
    color: #64748b;
    background: #f8fafc;
    padding: 0.625rem 0.875rem;
    border-radius: 0.5rem;
  }

  .modal__preview strong {
    color: #0f172a;
  }

  /* ── Footer do modal ────────────────────────────────────── */
  .modal__footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
  }
</style>
