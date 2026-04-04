<!--
  @page /colaborador/registro
  @description Página de registro de ponto — bater ponto e ver punches do dia.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '@/components/ui/Button.svelte';
  import { timesheetService } from '@/services/timesheet.service';
  import type { PunchType, DailySummary } from '@/services/timesheet.service';
  import { formatDate, formatTime } from '@/utils/date';

  const PUNCH_LABELS: Record<PunchType, string> = {
    entrada: 'Entrada',
    saida_almoco: 'Saída Almoço',
    retorno_almoco: 'Retorno Almoço',
    saida: 'Saída'
  };

  const PUNCH_SEQUENCE: PunchType[] = ['entrada', 'saida_almoco', 'retorno_almoco', 'saida'];

  let summary = $state<DailySummary | null>(null);
  let loading = $state(false);
  let punching = $state(false);
  let errorMsg = $state('');
  let now = $state(new Date());

  let nextPunchType: PunchType | null = $derived.by(() => {
    if (!summary) return 'entrada';
    const registered = summary.punches.map((p) => p.type);
    return PUNCH_SEQUENCE.find((type) => !registered.includes(type)) ?? null;
  });

  async function loadToday(): Promise<void> {
    loading = true;
    try {
      summary = await timesheetService.today();
    } catch {
      errorMsg = 'Erro ao carregar registros do dia.';
    } finally {
      loading = false;
    }
  }

  async function handlePunch(): Promise<void> {
    const type = nextPunchType;
    if (!type) return;

    punching = true;
    errorMsg = '';
    try {
      await timesheetService.punch({ type, method: 'manual' });
      await loadToday();
    } catch {
      errorMsg = 'Erro ao registrar ponto.';
    } finally {
      punching = false;
    }
  }

  onMount(() => {
    loadToday();
    const timer = setInterval(() => (now = new Date()), 1000);
    return () => clearInterval(timer);
  });
</script>

<svelte:head>
  <title>Registrar Ponto — Ponto Digital</title>
</svelte:head>

<section class="registro">
  <h1>Registrar Ponto</h1>

  <div class="registro__clock">
    <span class="clock__date">{formatDate(now)}</span>
    <span class="clock__time">
      {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  </div>

  {#if errorMsg}
    <div class="error" role="alert">{errorMsg}</div>
  {/if}

  <div class="registro__action">
    {#if nextPunchType}
      <Button variant="primary" size="lg" loading={punching} onclick={handlePunch}>
        {PUNCH_LABELS[nextPunchType]}
      </Button>
    {:else}
      <p class="registro__done">Todos os registros do dia foram feitos.</p>
    {/if}
  </div>

  <div class="registro__list">
    <h2>Registros de hoje</h2>

    {#if loading}
      <p class="registro__loading">Carregando...</p>
    {:else if summary && summary.punches.length > 0}
      <ul>
        {#each summary.punches as punch (punch)}
          <li class="punch-item">
            <span class="punch-item__type">{PUNCH_LABELS[punch.type]}</span>
            <span class="punch-item__time">{formatTime(punch.timestamp)}</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="registro__empty">Nenhum registro ainda.</p>
    {/if}
  </div>
</section>

<style>
  .registro {
    max-width: 480px;
    margin: 0 auto;
  }

  .registro__clock {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    margin: 1.5rem 0;
    padding: 1.5rem;
    background: #fff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .clock__date {
    font-size: 0.875rem;
    color: #64748b;
  }

  .clock__time {
    font-size: 2.5rem;
    font-weight: 700;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
  }

  .registro__action {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .registro__done {
    color: #16a34a;
    font-weight: 600;
    text-align: center;
  }

  .registro__list h2 {
    font-size: 1.125rem;
    margin-bottom: 0.75rem;
    color: #0f172a;
  }

  .registro__list ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .punch-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #fff;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .punch-item__type {
    font-weight: 600;
    color: #334155;
  }

  .punch-item__time {
    font-variant-numeric: tabular-nums;
    color: #2563eb;
    font-weight: 600;
  }

  .registro__loading,
  .registro__empty {
    text-align: center;
    color: #94a3b8;
    padding: 1rem;
  }

  .error {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    text-align: center;
  }
</style>
