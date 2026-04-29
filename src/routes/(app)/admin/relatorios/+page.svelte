<!--
  @page /admin/relatorios
  @description Espelho individual e consolidado mensal.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { relatorioService, type ConsolidadoRelatorio } from '@/services/relatorio.service';
  import { colaboradorService } from '@/services/colaborador.service';
  import type { Colaborador } from '@/types/colaborador';
  import EspelhoMensal from '@/components/timesheet/EspelhoMensal.svelte';

  let aba = $state<'espelho' | 'consolidado'>('espelho');
  let colaboradores = $state<Colaborador[]>([]);
  let errorMsg = $state('');

  const hoje = new Date();
  const mesDefault = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  // Espelho mensal
  let espColaboradorId = $state('');
  let espMes = $state(mesDefault);
  let colaboradorSelecionado = $derived(
    colaboradores.find((c) => c.id === espColaboradorId) ?? null
  );

  // Consolidado
  let mes = $state(mesDefault);
  let conResult = $state<ConsolidadoRelatorio | null>(null);

  async function carregarConsolidado(e: Event) {
    e.preventDefault();
    errorMsg = '';
    try {
      conResult = await relatorioService.consolidado(mes);
    } catch {
      errorMsg = 'Erro ao gerar consolidado.';
    }
  }

  onMount(async () => {
    colaboradores = await colaboradorService.listar();
  });
</script>

<svelte:head><title>Relatórios — Admin</title></svelte:head>

<section class="page">
  <h1>Relatórios</h1>

  <nav class="tabs">
    <button class:active={aba === 'espelho'} onclick={() => (aba = 'espelho')}>Espelho individual</button>
    <button class:active={aba === 'consolidado'} onclick={() => (aba = 'consolidado')}>Consolidado mensal</button>
  </nav>

  {#if errorMsg}<div class="error">{errorMsg}</div>{/if}

  {#if aba === 'espelho'}
    <div class="card form">
      <div class="row">
        <label>
          Colaborador
          <select bind:value={espColaboradorId}>
            <option value="">Selecione…</option>
            {#each colaboradores as c (c.id)}
              <option value={c.id}>{c.nome}</option>
            {/each}
          </select>
        </label>
        <label>Mês<input type="month" bind:value={espMes} /></label>
      </div>
    </div>

    {#if espColaboradorId && colaboradorSelecionado}
      <div class="card">
        <h2>{colaboradorSelecionado.nome}</h2>
        <p class="muted">Espelho de {espMes}</p>
        <EspelhoMensal
          colaboradorId={espColaboradorId}
          colaboradorNome={colaboradorSelecionado.nome}
          mes={espMes}
        />
      </div>
    {:else}
      <p class="muted">Selecione um colaborador para visualizar o espelho mensal.</p>
    {/if}
  {:else}
    <form class="card form" onsubmit={carregarConsolidado}>
      <label>Mês<input type="month" bind:value={mes} required /></label>
      <button class="btn" type="submit">Gerar</button>
    </form>

    {#if conResult}
      <div class="card">
        <h2>Consolidado — {conResult.mes}</h2>
        <table>
          <thead>
            <tr>
              <th>Colaborador</th><th>Dias</th><th>Horas</th><th>Extras</th><th>Déficit</th><th>Férias</th><th>Justificadas</th>
            </tr>
          </thead>
          <tbody>
            {#each conResult.linhas as l (l.colaboradorId)}
              <tr>
                <td>{l.colaboradorNome}</td>
                <td>{l.diasTrabalhados}</td>
                <td>{l.horas}h</td>
                <td>{l.extras}h</td>
                <td>{l.deficit}h</td>
                <td>{l.periodosFerias}</td>
                <td>{l.faltasJustificadas}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</section>

<style>
  .page { padding: 2rem; max-width: 1100px; margin: 0 auto; }
  h1 { margin: 0 0 1rem; }
  .tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; }
  .tabs button { background: none; border: none; padding: 0.75rem 1rem; font-size: 0.9rem; cursor: pointer; color: #64748b; border-bottom: 2px solid transparent; }
  .tabs button.active { color: #3b82f6; border-bottom-color: #3b82f6; font-weight: 600; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; }
  .card h2 { margin: 0 0 0.5rem; }
  label { display: block; margin-bottom: 0.75rem; font-size: 0.875rem; color: #475569; }
  input, select { display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.9rem; }
  .row { display: flex; gap: 0.75rem; }
  .row label { flex: 1; }
  .btn { padding: 0.625rem 1.25rem; background: #3b82f6; color: #fff; border: none; border-radius: 0.5rem; font-weight: 500; cursor: pointer; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th { text-align: left; padding: 0.5rem; font-size: 0.75rem; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  td { padding: 0.75rem 0.5rem; border-bottom: 1px solid #e2e8f0; }
  .muted { color: #64748b; }
  .error { background: #fef2f2; color: #b91c1c; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1rem; }
</style>
