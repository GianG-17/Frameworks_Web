<!--
  @page /admin/dashboard
  @description Dashboard do administrador com métricas e visão geral.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { adminService, type DashboardMetrics } from '@/services/admin.service';

  let metrics = $state<DashboardMetrics | null>(null);
  let loading = $state(true);
  let errorMsg = $state('');

  async function loadMetrics(): Promise<void> {
    loading = true;
    errorMsg = '';
    try {
      metrics = await adminService.dashboard();
    } catch {
      errorMsg = 'Erro ao carregar métricas.';
    } finally {
      loading = false;
    }
  }

  onMount(loadMetrics);
</script>

<svelte:head>
  <title>Dashboard — Ponto Digital</title>
</svelte:head>

<section class="dashboard">
  <header class="dashboard__header">
    <h1>Dashboard</h1>
    <button class="dashboard__refresh" onclick={loadMetrics} disabled={loading}>
      {loading ? 'Atualizando...' : 'Atualizar'}
    </button>
  </header>

  {#if errorMsg}
    <div class="error" role="alert">{errorMsg}</div>
  {/if}

  <div class="dashboard__cards">
    <div class="card">
      <span class="card__label">Colaboradores ativos</span>
      <span class="card__value">{loading ? '...' : (metrics?.colaboradoresAtivos ?? '--')}</span>
    </div>
    <div class="card">
      <span class="card__label">Pontos hoje</span>
      <span class="card__value">{loading ? '...' : (metrics?.pontosHoje ?? '--')}</span>
    </div>
    <div class="card">
      <span class="card__label">Total de usuários</span>
      <span class="card__value">{loading ? '...' : (metrics?.totalColaboradores ?? '--')}</span>
    </div>
    <div class="card">
      <span class="card__label">Horas extras (mês)</span>
      <span class="card__value">
        {loading ? '...' : metrics ? `${metrics.horasExtrasMes}h` : '--'}
      </span>
    </div>
  </div>
</section>

<style>
  .dashboard__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .dashboard__refresh {
    background: #fff;
    border: 1px solid #cbd5e1;
    color: #334155;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 150ms ease;
  }

  .dashboard__refresh:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .dashboard__refresh:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dashboard__cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .card {
    background: #fff;
    border-radius: 0.75rem;
    padding: 1.25rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .card__label {
    font-size: 0.875rem;
    color: #64748b;
  }

  .card__value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
  }

  .error {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
  }
</style>
