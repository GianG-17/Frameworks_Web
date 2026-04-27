<!--
  @page /admin/ferias
  @description Lista e cadastro de períodos de férias.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { feriasService, type Ferias } from '@/services/ferias.service';
  import { colaboradorService } from '@/services/colaborador.service';
  import type { Colaborador } from '@/types/colaborador';

  let lista = $state<Ferias[]>([]);
  let colaboradores = $state<Colaborador[]>([]);
  let errorMsg = $state('');
  let form = $state({ colaboradorId: '', dataInicio: '', dataFim: '', observacao: '' });

  async function carregar() {
    try {
      [lista, colaboradores] = await Promise.all([
        feriasService.list(),
        colaboradorService.listar()
      ]);
    } catch {
      errorMsg = 'Erro ao carregar dados.';
    }
  }

  async function criar(e: Event) {
    e.preventDefault();
    try {
      await feriasService.create({
        colaboradorId: form.colaboradorId,
        dataInicio: form.dataInicio,
        dataFim: form.dataFim,
        observacao: form.observacao || undefined
      });
      form = { colaboradorId: '', dataInicio: '', dataFim: '', observacao: '' };
      await carregar();
    } catch {
      errorMsg = 'Erro ao cadastrar férias.';
    }
  }

  async function remover(id: string) {
    if (!confirm('Remover este período?')) return;
    await feriasService.remove(id);
    await carregar();
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  onMount(carregar);
</script>

<svelte:head><title>Férias — Admin</title></svelte:head>

<section class="page">
  <h1>Férias</h1>

  {#if errorMsg}<div class="error">{errorMsg}</div>{/if}

  <form class="card form" onsubmit={criar}>
    <h2>Nova férias</h2>
    <label>
      Colaborador
      <select bind:value={form.colaboradorId} required>
        <option value="">Selecione…</option>
        {#each colaboradores as c (c.id)}
          <option value={c.id}>{c.nome}</option>
        {/each}
      </select>
    </label>
    <div class="row">
      <label>Início<input type="date" bind:value={form.dataInicio} required /></label>
      <label>Fim<input type="date" bind:value={form.dataFim} required /></label>
    </div>
    <label>Observação<input bind:value={form.observacao} /></label>
    <button class="btn" type="submit">Cadastrar</button>
  </form>

  <div class="card">
    <h2>Períodos cadastrados</h2>
    {#if lista.length === 0}
      <p class="muted">Nenhuma férias cadastrada.</p>
    {:else}
      <table>
        <thead><tr><th>Colaborador</th><th>Início</th><th>Fim</th><th>Observação</th><th></th></tr></thead>
        <tbody>
          {#each lista as f (f.id)}
            <tr>
              <td>{f.colaboradorNome}</td>
              <td>{fmt(f.dataInicio)}</td>
              <td>{fmt(f.dataFim)}</td>
              <td>{f.observacao ?? '—'}</td>
              <td><button class="btn-del" onclick={() => remover(f.id)}>🗑️</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</section>

<style>
  .page { padding: 2rem; max-width: 1000px; margin: 0 auto; }
  h1 { margin: 0 0 1.5rem; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; }
  .card h2 { margin: 0 0 1rem; font-size: 1.125rem; }
  label { display: block; margin-bottom: 0.75rem; font-size: 0.875rem; color: #475569; }
  input, select { display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.9rem; }
  .row { display: flex; gap: 0.75rem; }
  .row label { flex: 1; }
  .btn { padding: 0.625rem 1.25rem; background: #3b82f6; color: #fff; border: none; border-radius: 0.5rem; font-weight: 500; cursor: pointer; }
  .btn-del { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.25rem 0.5rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th { text-align: left; padding: 0.5rem; font-size: 0.75rem; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  td { padding: 0.75rem 0.5rem; border-bottom: 1px solid #e2e8f0; }
  .muted { color: #64748b; }
  .error { background: #fef2f2; color: #b91c1c; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1rem; }
</style>
