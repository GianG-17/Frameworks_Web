<!--
  @page /admin/dashboard
  @description Dashboard do administrador com métricas e visão geral.
-->
<script lang="ts">
  // TODO: buscar dados via timesheetService / adminService
</script>

<svelte:head>
  <title>Dashboard — Ponto Digital</title>
</svelte:head>

<section class="dashboard">
  <h1>Dashboard</h1>

  <div class="dashboard__cards">
    <div class="card">
      <span class="card__label">Colaboradores ativos</span>
      <span class="card__value">--</span>
    </div>
    <div class="card">
      <span class="card__label">Pontos hoje</span>
      <span class="card__value">--</span>
    </div>
    <div class="card">
      <span class="card__label">Atrasos (mês)</span>
      <span class="card__value">--</span>
    </div>
    <div class="card">
      <span class="card__label">Horas extras (mês)</span>
      <span class="card__value">--</span>
    </div>
  </div>
</section>

<style>
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

  .card__label { font-size: 0.875rem; color: #64748b; }
  .card__value { font-size: 1.75rem; font-weight: 700; color: #0f172a; }
</style>
