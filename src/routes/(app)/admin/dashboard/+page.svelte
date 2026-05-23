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
	import { formatTime } from '@/utils/date';
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

	// Férias que começam nos próximos 7 dias (se a API retornar)
	const feriasAtivasNoMes = $derived(metrics?.feriasAtivasNoMes ?? 0);
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
					{pendentes} justificativa{pendentes > 1 ? 's' : ''} pendente{pendentes > 1 ? 's' : ''}
				</a>
			{/if}
			<label class="dashboard__data-label">
				<span>Data</span>
				<input type="date" bind:value={dataRef} onchange={recarregar} />
			</label>
			<button class="refresh-btn" onclick={recarregar} disabled={loading}>
				{loading ? 'Atualizando…' : 'Atualizar'}
			</button>
		</div>
	</header>

	{#if errorMsg}
		<div class="error" role="alert">{errorMsg}</div>
	{/if}

	<!-- 4 cards essenciais -->
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
			tone={pendentes > 0 ? 'warning' : 'success'}
			label="Justificativas (mês)"
			value={loading ? '—' : (metrics?.justificativasMes ?? '—')}
		/>
		<StatCard tone="neutral" label="Férias ativas" value={loading ? '—' : feriasAtivasNoMes} />
	</div>

	<!-- Tabela de entradas ocupa toda a largura -->
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

	/* 4 cards lado a lado */
	.stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
	}

	@media (max-width: 768px) {
		.stats {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 480px) {
		.stats {
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

	.error {
		background: var(--color-danger-bg);
		color: var(--color-danger);
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
	}
</style>
