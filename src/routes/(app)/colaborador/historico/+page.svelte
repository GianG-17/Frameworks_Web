<!--
  @page /colaborador/historico
  @description Histórico de registros de ponto do colaborador.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { timesheetService } from '@/services/timesheet.service';
  import type { DailySummary, PunchType } from '@/services/timesheet.service';
  import { formatDate, formatTime, formatHoursMinutes } from '@/utils/date';
	import { SvelteDate } from 'svelte/reactivity';

  const PUNCH_LABELS: Record<PunchType, string> = {
    entrada: 'Entrada',
    saida_almoco: 'Saída Almoço',
    retorno_almoco: 'Retorno Almoço',
    saida: 'Saída'
  };

  let history = $state<DailySummary[]>([]);
  let loading = $state(false);
  let errorMsg = $state('');

  function defaultDateRange(): { startDate: string; endDate: string } {
    const end = new SvelteDate();
    const start = new SvelteDate();
    start.setDate(end.getDate() - 30);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }

  async function loadHistory(): Promise<void> {
    loading = true;
    errorMsg = '';
    try {
      history = await timesheetService.history(defaultDateRange());
    } catch {
      errorMsg = 'Erro ao carregar histórico.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadHistory();
  });
</script>

<svelte:head>
  <title>Histórico — Ponto Digital</title>
</svelte:head>

<section class="historico">
  <h1>Histórico de Ponto</h1>

  {#if errorMsg}
    <div class="error" role="alert">{errorMsg}</div>
  {/if}

  {#if loading}
    <p class="historico__loading">Carregando...</p>
  {:else if history.length > 0}
    <div class="historico__list">
      {#each history as day (day)}
        <div class="day-card">
          <div class="day-card__header">
            <span class="day-card__date">{formatDate(day.date)}</span>
            <span class="day-card__hours">{formatHoursMinutes(day.totalHours * 60)}</span>
          </div>

          <div class="day-card__punches">
            {#each day.punches as punch (punch)}
              <div class="day-card__punch">
                <span class="punch__label">{PUNCH_LABELS[punch.type]}</span>
                <span class="punch__time">{formatTime(punch.timestamp)}</span>
              </div>
            {/each}
          </div>

          <div class="day-card__footer">
            {#if day.overtime > 0}
              <span class="badge badge--positive">+{formatHoursMinutes(day.overtime * 60)} extra</span>
            {/if}
            {#if day.deficit > 0}
              <span class="badge badge--negative">-{formatHoursMinutes(day.deficit * 60)} déficit</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="historico__empty">Nenhum registro encontrado nos últimos 30 dias.</p>
  {/if}
</section>

<style>
  .historico {
    max-width: 640px;
    margin: 0 auto;
  }

  .historico__list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .day-card {
    background: #fff;
    border-radius: 0.75rem;
    padding: 1.25rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .day-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .day-card__date {
    font-weight: 700;
    color: #0f172a;
  }

  .day-card__hours {
    font-weight: 600;
    color: #2563eb;
    font-variant-numeric: tabular-nums;
  }

  .day-card__punches {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.5rem;
  }

  .day-card__punch {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .punch__label {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .punch__time {
    font-weight: 600;
    color: #334155;
    font-variant-numeric: tabular-nums;
  }

  .day-card__footer {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
  }

  .badge--positive {
    background: #f0fdf4;
    color: #16a34a;
  }

  .badge--negative {
    background: #fef2f2;
    color: #dc2626;
  }

  .historico__loading,
  .historico__empty {
    text-align: center;
    color: #94a3b8;
    padding: 2rem;
  }

  .error {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
    text-align: center;
  }
</style>
