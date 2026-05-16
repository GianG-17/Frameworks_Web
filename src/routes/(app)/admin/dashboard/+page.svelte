<!--
  @page /admin/dashboard
  @description Dashboard do administrador com métricas e visão geral.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import {
		adminService,
		type DashboardMetrics,
		type EntradaStatus
	} from '@/services/admin.service';
	import { formatDate, formatTime } from '@/utils/date';
	import Badge from '@/components/ui/Badge.svelte';
	import Card from '@/components/ui/Card.svelte';
	import StatCard from '@/components/ui/StatCard.svelte';
	import Avatar from '@/components/ui/Avatar.svelte';
	import Icon from '@/components/ui/Icon.svelte';

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

	const statusLabels: Record<EntradaStatus, string> = {
		pontual: 'Pontual',
		atrasado: 'Atrasado',
		falta: 'Falta',
		pendente: 'Pendente',
		folga: 'Folga',
		sem_jornada: 'Sem jornada'
	};

	const statusVariant: Record<
		EntradaStatus,
		'success' | 'warning' | 'danger' | 'info' | 'neutral'
	> = {
		pontual: 'success',
		atrasado: 'danger',
		falta: 'danger',
		pendente: 'warning',
		folga: 'neutral',
		sem_jornada: 'info'
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

	function initialsFromName(name: string): string {
		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((p) => p[0])
			.join('')
			.toUpperCase();
	}

	const avatarColors = ['#2563eb', '#7c3aed', '#0891b2', '#16a34a', '#d97706'];

	const pendentes = $derived(metrics?.justificativasMes ?? 0);
</script>

<svelte:head>
	<title>Dashboard — Ponto Digital</title>
</svelte:head>

<section class="dashboard">
	<header class="dashboard__header">
		<div>
			<h1>Dashboard</h1>
			<p class="dashboard__sub">
				{new Date(`${dataRef}T12:00:00`).toLocaleDateString('pt-BR', {
					weekday: 'long',
					day: '2-digit',
					month: 'long'
				})}
			</p>
		</div>
		<div class="dashboard__filtros">
			{#if pendentes > 0}
				<a href={resolve('/admin/justificativas', {})} class="alert-btn">
					<Icon name="alert" size={14} />
					{pendentes} justificativa{pendentes > 1 ? 's' : ''} no mês
				</a>
			{/if}
			<label class="dashboard__data-label">
				<span>Data</span>
				<input type="date" bind:value={dataRef} />
			</label>
			<button class="refresh-btn" onclick={recarregar} disabled={loading}>
				{loading ? 'Atualizando…' : 'Atualizar'}
			</button>
		</div>
	</header>

	{#if errorMsg}
		<div class="error" role="alert">{errorMsg}</div>
	{/if}

	<div class="stats">
		<StatCard
			tone="info"
			label="Colaboradores ativos"
			value={loading ? '—' : (metrics?.colaboradoresAtivos ?? '—')}
		/>
		<StatCard
			tone="info"
			label="Pontos no dia"
			value={loading ? '—' : (metrics?.pontosHoje ?? '—')}
		/>
		<StatCard
			tone={metrics && metrics.atrasosHoje === 0 ? 'success' : 'danger'}
			label="Atrasos no dia"
			value={loading ? '—' : (metrics?.atrasosHoje ?? '—')}
		/>
		<StatCard
			tone={metrics && metrics.faltasHoje === 0 ? 'success' : 'danger'}
			label="Faltas no dia"
			value={loading ? '—' : (metrics?.faltasHoje ?? '—')}
		/>
		<StatCard
			tone="success"
			label="Horas extras (mês)"
			value={loading ? '—' : `${metrics?.horasExtrasMes ?? '—'}h`}
		/>
		<StatCard
			tone="warning"
			label="Déficit (mês)"
			value={loading ? '—' : `${metrics?.horasDeficitMes ?? '—'}h`}
		/>
		<StatCard
			tone="neutral"
			label="Justificativas (mês)"
			value={loading ? '—' : (metrics?.justificativasMes ?? '—')}
		/>
		<StatCard
			tone="neutral"
			label="Férias ativas"
			value={loading ? '—' : (metrics?.feriasAtivasNoMes ?? '—')}
		/>
	</div>

	<div class="grid">
		<Card>
			<header class="panel__header">
				<h2>Entradas do dia</h2>
				<span class="panel__hint">tolerância &gt; 10 min para "atrasado"</span>
			</header>
			{#if loading}
				<p class="panel__empty">Carregando…</p>
			{:else if !metrics || metrics.entradasHoje.length === 0}
				<p class="panel__empty">Nenhum colaborador ativo.</p>
			{:else}
				<div class="entradas">
					{#each metrics.entradasHoje as e, i (e.colaboradorId)}
						<div class="entrada">
							<Avatar
								initials={initialsFromName(e.nome)}
								size={36}
								color={avatarColors[i % avatarColors.length]}
							/>
							<div class="entrada__meta">
								<div class="entrada__nome">{e.nome}</div>
								<div class="entrada__sub">
									Previsto {e.jornadaEntrada ?? '—'} · Bateu {e.batidaEntrada
										? formatTime(e.batidaEntrada)
										: '—'}
								</div>
							</div>
							<div class="entrada__right">
								<Badge variant={statusVariant[e.status]} dot>{statusLabels[e.status]}</Badge>
								<span class="entrada__atraso">{formatAtraso(e.atrasoMin)}</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card>

		<Card>
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
		</Card>
	</div>

	<Card>
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
	</Card>
</section>

<style>
	.dashboard {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.dashboard__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.dashboard__header h1 {
		margin: 0;
		font-size: 1.375rem;
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: -0.02em;
	}

	.dashboard__sub {
		margin: 0.125rem 0 0;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		text-transform: capitalize;
	}

	.dashboard__filtros {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.dashboard__data-label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.dashboard__data-label input {
		padding: 0.5rem 0.625rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		font-family: inherit;
	}

	.refresh-btn {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		color: #475569;
		padding: 0.5rem 0.875rem;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		height: 2.25rem;
	}

	.refresh-btn:hover:not(:disabled) {
		background: var(--color-surface-muted);
	}

	.refresh-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.alert-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-warning-soft);
		border: 1px solid var(--color-warning-soft-border);
		color: var(--color-warning-strong);
		border-radius: 0.625rem;
		padding: 0.5rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		height: 2.25rem;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem;
	}

	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: 1rem;
	}

	@media (max-width: 900px) {
		.grid {
			grid-template-columns: 1fr;
		}
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
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.panel__hint {
		font-size: 0.75rem;
		color: var(--color-text-subtle);
	}

	.panel__empty {
		color: var(--color-text-muted);
		font-size: 0.875rem;
		margin: 0;
	}

	.entradas {
		display: flex;
		flex-direction: column;
	}

	.entrada {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border-soft);
	}

	.entrada:last-child {
		border-bottom: none;
	}

	.entrada__meta {
		flex: 1;
		min-width: 0;
	}

	.entrada__nome {
		font-weight: 600;
		color: var(--color-text);
		font-size: 0.9rem;
	}

	.entrada__sub {
		color: var(--color-text-subtle);
		font-size: 0.75rem;
		margin-top: 0.125rem;
	}

	.entrada__right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
	}

	.entrada__atraso {
		font-size: 0.7rem;
		color: var(--color-text-subtle);
		font-variant-numeric: tabular-nums;
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
		background: var(--color-border-soft);
		border-radius: var(--radius-pill);
		height: 0.5rem;
		overflow: hidden;
	}

	.ranking__bar-fill {
		background: linear-gradient(90deg, #3b82f6, var(--color-primary));
		height: 100%;
		border-radius: var(--radius-pill);
	}

	.ranking__valor {
		font-variant-numeric: tabular-nums;
		color: var(--color-text);
		font-weight: 700;
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
		background: linear-gradient(180deg, #60a5fa, var(--color-primary));
		border-radius: 0.25rem 0.25rem 0 0;
		transition: height 200ms ease;
	}

	.chart__label {
		font-size: 0.65rem;
		color: var(--color-text-subtle);
		font-variant-numeric: tabular-nums;
	}

	.chart__hint {
		margin: 0.75rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.error {
		background: var(--color-danger-bg);
		color: var(--color-danger);
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
	}
</style>
