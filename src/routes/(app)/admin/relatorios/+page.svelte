<!--
  @page /admin/relatorios
  @description Espelho individual e consolidado mensal.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { relatorioService, type EspelhoRelatorio, type ConsolidadoRelatorio } from '@/services/relatorio.service';
  import { colaboradorService } from '@/services/colaborador.service';
  import type { Colaborador } from '@/types/colaborador';

  let aba = $state<'espelho' | 'consolidado'>('espelho');
  let colaboradores = $state<Colaborador[]>([]);
  let errorMsg = $state('');

  // Espelho
  let esp = $state({ colaboradorId: '', inicio: '', fim: '' });
  let espResult = $state<EspelhoRelatorio | null>(null);

  // Consolidado
  const hoje = new Date();
  const mesDefault = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  let mes = $state(mesDefault);
  let conResult = $state<ConsolidadoRelatorio | null>(null);

  async function carregarEspelho(e: Event) {
    e.preventDefault();
    errorMsg = '';
    try {
      espResult = await relatorioService.espelho(esp);
    } catch {
      errorMsg = 'Erro ao gerar espelho.';
    }
  }

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
    <form class="card form" onsubmit={carregarEspelho}>
      <label>
        Colaborador
        <select bind:value={esp.colaboradorId} required>
          <option value="">Selecione…</option>
          {#each colaboradores as c (c.id)}
            <option value={c.id}>{c.nome}</option>
          {/each}
        </select>
      </label>
      <div class="row">
        <label>Início<input type="date" bind:value={esp.inicio} required /></label>
        <label>Fim<input type="date" bind:value={esp.fim} required /></label>
      </div>
      <button class="btn" type="submit">Gerar</button>
    </form>

    {#if espResult}
      <div class="card">
        <h2>{espResult.colaborador.nome}</h2>
        <p class="muted">{espResult.inicio} a {espResult.fim}</p>
        <div class="totais">
          <span><strong>{espResult.totais.horas}h</strong> trabalhadas</span>
          <span><strong>{espResult.totais.extras}h</strong> extras</span>
          <span><strong>{espResult.totais.deficit}h</strong> déficit</span>
        </div>
        {#if espResult.dias.length === 0}
          <p class="muted">Nenhum ponto registrado no período.</p>
        {:else}
          <table>
            <thead><tr><th>Data</th><th>Batidas</th><th>Horas</th><th>Extra</th><th>Déficit</th></tr></thead>
            <tbody>
              {#each espResult.dias as d (d.date)}
                <tr>
                  <td>{d.date}</td>
                  <td>{d.punches.length}</td>
                  <td>{d.totalHours}h</td>
                  <td>{d.overtime}h</td>
                  <td>{d.deficit}h</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
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
  .totais { display: flex; gap: 2rem; margin: 1rem 0; color: #334155; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th { text-align: left; padding: 0.5rem; font-size: 0.75rem; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  td { padding: 0.75rem 0.5rem; border-bottom: 1px solid #e2e8f0; }
  .muted { color: #64748b; }
  .error { background: #fef2f2; color: #b91c1c; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1rem; }
</style>
