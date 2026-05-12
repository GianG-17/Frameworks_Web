<!--
  @page /admin/dashboard
  @description Dashboard do administrador com métricas e visão geral.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		adminService,
		type DashboardMetrics,
		type EntradaStatus
	} from '@/services/admin.service';
	import { formatDate, formatTime } from '@/utils/date';

	let metrics = $state<DashboardMetrics | null>(null);
	let loading = $state(true);
	let errorMsg = $state('');

	function hojeISO(): string {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	let dataRef = $state(hojeISO());

	async function loadMetrics(): Promise<void> {
		loading = true;
		errorMsg = '';
		try {
			metrics = await adminService.dashboard(dataRef || undefined);
		} catch {
			errorMsg = 'Erro ao carregar métricas.';
		} finally {
			loading = false;
		}
	}

	function recarregar() {
		loadMetrics();
	}

	onMount(loadMetrics);

	// ── Helpers de apresentação ─────────────────────────────────────────────
	const statusLabels: Record<EntradaStatus, string> = {
		pontual: 'Pontual',
		atrasado: 'Atrasado',
		falta: 'Falta',
		pendente: 'Pendente',
		folga: 'Folga',
		sem_jornada: 'Sem jornada'
	};

	function maxHoras(serie: { horas: number }[]): number {
		return Math.max(1, ...serie.map((p) => p.horas));
	}

	function formatAtraso(min: number): string {
		if (min <= 0) return '—';
		if (min < 60) return `+${min} min`;
		const h = Math.floor(min / 60);
		const m = min % 60;
		return m === 0 ? `+${h}h` : `+${h}h ${m}min`;
	}
</script>

<svelte:head>
	<title>Dashboard — Ponto Digital</title>
</svelte:head>

<section class="dashboard">
	<header class="dashboard__header">
		<div>
			<h1>Dashboard</h1>
			{#if metrics}
				<p class="dashboard__sub">
					Referência: <strong>{formatDate(metrics.referenciaData)}</strong>
				</p>
			{/if}
		</div>
		<div class="dashboard__filtros">
			<label class="dashboard__data-label">
				Data
				<input type="date" bind:value={dataRef} />
			</label>
			<button class="dashboard__refresh" onclick={recarregar} disabled={loading}>
				{loading ? 'Atualizando…' : 'Atualizar'}
			</button>
		</div>
	</header>

	{#if errorMsg}
		<div class="error" role="alert">{errorMsg}</div>
	{/if}

	<!-- ── KPIs ──────────────────────────────────────────────────────────── -->
	<div class="cards">
		<div class="card">
			<span class="card__label">Colaboradores ativos</span>
			<span class="card__value">{loading ? '…' : (metrics?.colaboradoresAtivos ?? '--')}</span>
			<span class="card__hint">de {metrics?.totalColaboradoresRegistrados ?? '--'} cadastrados</span
			>
		</div>
		<div class="card">
			<span class="card__label">Pontos no dia</span>
			<span class="card__value">{loading ? '…' : (metrics?.pontosHoje ?? '--')}</span>
		</div>
		<div class="card card--alert" class:card--ok={metrics && metrics.atrasosHoje === 0}>
			<span class="card__label">Atrasos no dia</span>
			<span class="card__value">{loading ? '…' : (metrics?.atrasosHoje ?? '--')}</span>
		</div>
		<div class="card card--alert" class:card--ok={metrics && metrics.faltasHoje === 0}>
			<span class="card__label">Faltas (sem batida)</span>
			<span class="card__value">{loading ? '…' : (metrics?.faltasHoje ?? '--')}</span>
		</div>
		<div class="card">
			<span class="card__label">Horas extras (mês)</span>
			<span class="card__value">{loading ? '…' : `${metrics?.horasExtrasMes ?? '--'}h`}</span>
		</div>
		<div class="card">
			<span class="card__label">Horas em déficit (mês)</span>
			<span class="card__value">{loading ? '…' : `${metrics?.horasDeficitMes ?? '--'}h`}</span>
		</div>
		<div class="card">
			<span class="card__label">Justificativas no mês</span>
			<span class="card__value">{loading ? '…' : (metrics?.justificativasMes ?? '--')}</span>
		</div>
		<div class="card">
			<span class="card__label">Férias ativas</span>
			<span class="card__value">{loading ? '…' : (metrics?.feriasAtivasNoMes ?? '--')}</span>
		</div>
	</div>

	<div class="dashboard__grid">
		<!-- ── Entradas do dia ──────────────────────────────────────────── -->
		<section class="panel">
			<header class="panel__header">
				<h2>Entradas do dia</h2>
				<span class="panel__hint">tolerância &gt; 10 min para "atrasado"</span>
			</header>
			{#if loading}
				<p class="panel__empty">Carregando…</p>
			{:else if !metrics || metrics.entradasHoje.length === 0}
				<p class="panel__empty">Nenhum colaborador ativo.</p>
			{:else}
				<table class="tabela">
					<thead>
						<tr>
							<th>Colaborador</th>
							<th>Previsto</th>
							<th>Bateu</th>
							<th>Atraso</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each metrics.entradasHoje as e (e.colaboradorId)}
							<tr>
								<td>{e.nome}</td>
								<td class="num">{e.jornadaEntrada ?? '—'}</td>
								<td class="num">{e.batidaEntrada ? formatTime(e.batidaEntrada) : '—'}</td>
								<td class="num">{formatAtraso(e.atrasoMin)}</td>
								<td>
									<span class="badge badge--{e.status}">{statusLabels[e.status]}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>

		<!-- ── Top 5 horas extras ───────────────────────────────────────── -->
		<section class="panel">
			<header class="panel__header">
				<h2>Top 5 — Horas extras no mês</h2>
			</header>
			{#if loading}
				<p class="panel__empty">Carregando…</p>
			{:else if !metrics || metrics.topExtras.length === 0}
				<p class="panel__empty">Nenhuma hora extra registrada no mês.</p>
			{:else}
				{@const max = maxHoras(metrics.topExtras)}
				<ul class="ranking">
					{#each metrics.topExtras as t (t.colaboradorId)}
						<li class="ranking__item">
							<span class="ranking__nome">{t.nome}</span>
							<div class="ranking__bar">
								<div class="ranking__bar-fill" style="width: {(t.horas / max) * 100}%"></div>
							</div>
							<span class="ranking__valor">{t.horas}h</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>

	<!-- ── Gráfico horas extras por dia ──────────────────────────────────── -->
	<section class="panel">
		<header class="panel__header">
			<h2>Horas extras por dia — mês de referência</h2>
		</header>
		{#if loading}
			<p class="panel__empty">Carregando…</p>
		{:else if !metrics || metrics.horasExtrasPorDia.every((p) => p.horas === 0)}
			<p class="panel__empty">Sem horas extras registradas no mês.</p>
		{:else}
			{@const serie = metrics.horasExtrasPorDia}
			{@const max = maxHoras(serie)}
			<div class="chart">
				{#each serie as p (p.date)}
					{@const altura = (p.horas / max) * 100}
					<div class="chart__col" title="{formatDate(p.date)} — {p.horas}h">
						<div class="chart__bar" style="height: {altura}%"></div>
						<span class="chart__label">{p.date.slice(8, 10)}</span>
					</div>
				{/each}
			</div>
			<p class="chart__hint">
				Total: <strong>{metrics.horasExtrasMes}h</strong> · Pico no dia
				<strong>
					{(() => {
						const top = [...serie].sort((a, b) => b.horas - a.horas)[0];
						return top.horas > 0 ? `${formatDate(top.date)} (${top.horas}h)` : '—';
					})()}
				</strong>
			</p>
		{/if}
	</section>
</section>

<style>
	.dashboard {
		padding: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.dashboard__header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.dashboard__header h1 {
		margin: 0;
	}

	.dashboard__sub {
		margin: 0.25rem 0 0;
		color: #64748b;
		font-size: 0.875rem;
	}

	.dashboard__filtros {
		display: flex;
		align-items: flex-end;
		gap: 0.75rem;
	}

	.dashboard__data-label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #64748b;
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
		height: 2.5rem;
	}

	.dashboard__refresh:hover:not(:disabled) {
		background: #f1f5f9;
		border-color: #94a3b8;
	}

	.dashboard__refresh:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem;
		margin: 1.5rem 0;
	}

	.card {
		background: #fff;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.card__label {
		font-size: 0.8125rem;
		color: #64748b;
	}

	.card__value {
		font-size: 1.75rem;
		font-weight: 700;
		color: #0f172a;
		font-variant-numeric: tabular-nums;
	}

	.card__hint {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.card--alert .card__value {
		color: #dc2626;
	}
	.card--alert.card--ok .card__value {
		color: #16a34a;
	}

	.dashboard__grid {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: 1rem;
		margin-bottom: 1rem;
	}

	@media (max-width: 900px) {
		.dashboard__grid {
			grid-template-columns: 1fr;
		}
	}

	.panel {
		background: #fff;
		border-radius: 0.75rem;
		padding: 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		margin-bottom: 1rem;
	}

	.panel__header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.panel__header h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #0f172a;
	}

	.panel__hint {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.panel__empty {
		color: #64748b;
		font-size: 0.875rem;
		margin: 0;
	}

	.tabela {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.tabela th {
		text-align: left;
		padding: 0.5rem 0.5rem 0.5rem 0;
		font-size: 0.75rem;
		text-transform: uppercase;
		color: #64748b;
		border-bottom: 1px solid #e2e8f0;
	}

	.tabela td {
		padding: 0.625rem 0.5rem 0.625rem 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.tabela td.num {
		font-variant-numeric: tabular-nums;
		color: #334155;
	}

	.badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.badge--pontual {
		background: #dcfce7;
		color: #166534;
	}
	.badge--atrasado {
		background: #fee2e2;
		color: #991b1b;
	}
	.badge--falta {
		background: #fee2e2;
		color: #7f1d1d;
	}
	.badge--pendente {
		background: #fef3c7;
		color: #92400e;
	}
	.badge--folga {
		background: #e2e8f0;
		color: #475569;
	}
	.badge--sem_jornada {
		background: #f3e8ff;
		color: #6b21a8;
	}

	.ranking {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.ranking__item {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
	}

	.ranking__nome {
		color: #334155;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ranking__bar {
		background: #f1f5f9;
		border-radius: 999px;
		height: 0.5rem;
		overflow: hidden;
	}

	.ranking__bar-fill {
		background: linear-gradient(90deg, #3b82f6, #2563eb);
		height: 100%;
		border-radius: 999px;
	}

	.ranking__valor {
		font-variant-numeric: tabular-nums;
		color: #0f172a;
		font-weight: 600;
	}

	.chart {
		display: flex;
		align-items: flex-end;
		gap: 0.25rem;
		height: 180px;
		padding-top: 0.5rem;
	}

	.chart__col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		gap: 0.25rem;
		height: 100%;
	}

	.chart__bar {
		width: 100%;
		min-height: 1px;
		background: linear-gradient(180deg, #60a5fa, #2563eb);
		border-radius: 0.25rem 0.25rem 0 0;
		transition: height 200ms ease;
	}

	.chart__col[title]:hover .chart__bar {
		filter: brightness(1.1);
	}

	.chart__label {
		font-size: 0.65rem;
		color: #94a3b8;
		font-variant-numeric: tabular-nums;
	}

	.chart__hint {
		margin: 0.75rem 0 0;
		font-size: 0.8125rem;
		color: #64748b;
	}

	.error {
		background: #fef2f2;
		color: #dc2626;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		margin-top: 1rem;
	}
</style>
