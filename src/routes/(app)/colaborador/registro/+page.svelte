<!--
  @page /colaborador/registro
  @description Página de registro de ponto — bater ponto e ver punches do dia.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Button from '@/components/ui/Button.svelte';
	import Card from '@/components/ui/Card.svelte';
	import Icon from '@/components/ui/Icon.svelte';
	import { timesheetService } from '@/services/timesheet.service';
	import type { PunchType, DailySummary } from '@/services/timesheet.service';
	import { formatTime, diffInMinutes } from '@/utils/date';
	import { useQrScanner } from '@/hooks/useQrScanner';

	const PUNCH_LABELS: Record<PunchType, string> = {
		entrada: 'Entrada',
		saida_almoco: 'Saída Almoço',
		retorno_almoco: 'Retorno Almoço',
		saida: 'Saída'
	};

	const PUNCH_SEQUENCE: PunchType[] = ['entrada', 'saida_almoco', 'retorno_almoco', 'saida'];

	const PUNCH_DOT: Record<PunchType, string> = {
		entrada: '#22c55e',
		saida_almoco: '#f97316',
		retorno_almoco: '#3b82f6',
		saida: '#8b5cf6'
	};

	let summary = $state<DailySummary | null>(null);
	let loading = $state(false);
	let punching = $state(false);
	let errorMsg = $state('');
	let now = $state(new Date());
	let lastSuccess = $state('');

	const nextPunchType: PunchType | null = $derived.by(() => {
		if (!summary) return 'entrada';
		const registered = summary.punches.map((p) => p.type);
		return PUNCH_SEQUENCE.find((type) => !registered.includes(type)) ?? null;
	});

	const totalMinutes = $derived.by(() => {
		if (!summary || summary.punches.length < 2) return 0;
		const byType = new Map(summary.punches.map((p) => [p.type, p.timestamp]));
		let total = 0;
		const ent = byType.get('entrada');
		const saA = byType.get('saida_almoco');
		const reA = byType.get('retorno_almoco');
		const sai = byType.get('saida');
		if (ent && saA) total += diffInMinutes(ent, saA);
		if (reA && sai) total += diffInMinutes(reA, sai);
		else if (reA && !sai) total += diffInMinutes(reA, now);
		return Math.max(0, total);
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

	let qrInput = $state('');
	let scannerOpen = $state(false);
	let videoEl: HTMLVideoElement | undefined = $state();
	const scanner = useQrScanner();
	const scannerError = scanner.error;
	const scannerResult = scanner.lastResult;

	async function abrirScanner() {
		errorMsg = '';
		scannerOpen = true;
		await Promise.resolve();
		if (videoEl) await scanner.start(videoEl);
	}

	function fecharScanner() {
		scanner.stop();
		scannerOpen = false;
	}

	async function handlePunch(): Promise<void> {
		const type = nextPunchType;
		if (!type) return;

		punching = true;
		errorMsg = '';
		try {
			await timesheetService.punch({ type, method: 'manual' });
			lastSuccess = PUNCH_LABELS[type];
			setTimeout(() => (lastSuccess = ''), 3000);
			await loadToday();
		} catch {
			errorMsg = 'Erro ao registrar ponto.';
		} finally {
			punching = false;
		}
	}

	async function processarPayload(payload: string): Promise<void> {
		const type = nextPunchType;
		if (!type) return;
		punching = true;
		errorMsg = '';
		try {
			const parsed = JSON.parse(payload) as { empresaId: string; token: string };
			if (!parsed.empresaId || !parsed.token) throw new Error('formato');
			await timesheetService.punchQr({ empresaId: parsed.empresaId, token: parsed.token, type });
			qrInput = '';
			fecharScanner();
			lastSuccess = PUNCH_LABELS[type];
			setTimeout(() => (lastSuccess = ''), 3000);
			await loadToday();
		} catch {
			errorMsg = 'QR Code inválido ou expirado.';
		} finally {
			punching = false;
		}
	}

	async function handleQrPunch(): Promise<void> {
		if (!qrInput.trim()) {
			errorMsg = 'Cole o conteúdo do QR Code.';
			return;
		}
		await processarPayload(qrInput);
	}

	scannerResult.subscribe((value) => {
		if (value && scannerOpen && !punching) {
			processarPayload(value);
		}
	});

	onMount(() => {
		loadToday();
		const timer = setInterval(() => (now = new Date()), 1000);
		return () => clearInterval(timer);
	});

	onDestroy(() => {
		scanner.stop();
	});

	function punchAt(type: PunchType): string | null {
		return summary?.punches.find((p) => p.type === type)?.timestamp ?? null;
	}
</script>

<svelte:head>
	<title>Registrar Ponto — Ponto Digital</title>
</svelte:head>

<section class="registro">
	<div class="clock">
		<span class="clock__date">
			{now.toLocaleDateString('pt-BR', {
				weekday: 'long',
				day: '2-digit',
				month: 'long',
				year: 'numeric'
			})}
		</span>
		<span class="clock__time">
			{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
		</span>
		{#if totalMinutes > 0}
			<span class="clock__worked">
				<Icon name="clock" size={13} />
				{Math.floor(totalMinutes / 60)}h {String(totalMinutes % 60).padStart(2, '0')}min trabalhados
			</span>
		{/if}
	</div>

	<Card>
		<div class="steps">
			{#each PUNCH_SEQUENCE as type, i (type)}
				{@const ts = punchAt(type)}
				{@const isDone = !!ts}
				{@const isNext = !isDone && nextPunchType === type}
				<div class="step">
					<div class="step__dot" class:is-done={isDone} class:is-next={isNext}>
						{#if isDone}
							<Icon name="check" size={12} stroke={3} />
						{:else if isNext}
							<span class="step__inner"></span>
						{/if}
					</div>
					<span class="step__label" class:is-done={isDone} class:is-next={isNext}>
						{PUNCH_LABELS[type]}
						{#if isDone}
							<br /><span class="step__time">{formatTime(ts!)}</span>
						{/if}
					</span>
				</div>
				{#if i < PUNCH_SEQUENCE.length - 1}
					<div class="step__line" class:is-done={isDone}></div>
				{/if}
			{/each}
		</div>
	</Card>

	{#if errorMsg}
		<div class="error" role="alert">{errorMsg}</div>
	{/if}

	<div class="action">
		{#if nextPunchType}
			<Button variant="primary" size="lg" loading={punching} onclick={handlePunch}>
				{PUNCH_LABELS[nextPunchType]}
			</Button>
		{:else}
			<div class="done-box">
				<Icon name="check-circle" size={28} />
				<span>Todos os registros do dia concluídos</span>
			</div>
		{/if}
		{#if lastSuccess}
			<div class="success-toast">
				<Icon name="check" size={14} stroke={2.5} />
				{lastSuccess} registrado com sucesso
			</div>
		{/if}
	</div>

	{#if nextPunchType}
		<Card>
			<h3 class="qr-title">Registrar via QR Code</h3>
			<p class="qr-hint">
				Escaneie o QR Code exibido pela empresa para registrar
				<strong>{PUNCH_LABELS[nextPunchType]}</strong>.
			</p>

			{#if scannerOpen}
				<div class="scanner">
					<video bind:this={videoEl}><track kind="captions" /></video>
					{#if $scannerError}<p class="error">{$scannerError}</p>{/if}
					<Button variant="secondary" size="md" onclick={fecharScanner}>Fechar câmera</Button>
				</div>
			{:else}
				<Button variant="secondary" size="md" onclick={abrirScanner}>Abrir câmera</Button>
			{/if}

			<details class="manual">
				<summary>Inserir manualmente</summary>
				<textarea bind:value={qrInput} placeholder={'{"empresaId":"...","token":"123456"}'} rows="3"
				></textarea>
				<Button variant="secondary" size="md" loading={punching} onclick={handleQrPunch}>
					Confirmar
				</Button>
			</details>
		</Card>
	{/if}

	{#if summary && summary.punches.length > 0}
		<Card>
			<h2 class="list-title">Registros de hoje</h2>
			<div class="punches">
				{#each summary.punches as punch (punch)}
					<div class="punch">
						<div class="punch__left">
							<span class="punch__dot" style="background: {PUNCH_DOT[punch.type]};"></span>
							<span class="punch__type">{PUNCH_LABELS[punch.type]}</span>
						</div>
						<span class="punch__time">{formatTime(punch.timestamp)}</span>
					</div>
				{/each}
			</div>
		</Card>
	{:else if loading}
		<p class="empty">Carregando...</p>
	{/if}
</section>

<style>
	.registro {
		max-width: 480px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.clock {
		background: var(--color-sidebar);
		border-radius: var(--radius-lg);
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.clock__date {
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		text-transform: capitalize;
	}

	.clock__time {
		color: #f8fafc;
		font-size: 3rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
	}

	.clock__worked {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		background: var(--color-sidebar-border);
		color: var(--color-sidebar-item-fg);
		padding: 0.3rem 0.75rem;
		border-radius: var(--radius-pill);
		font-size: 0.8rem;
		margin-top: 0.5rem;
	}

	.steps {
		display: flex;
		align-items: flex-start;
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		min-width: 64px;
	}

	.step__dot {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--color-border-soft);
		border: 2px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
	}

	.step__dot.is-done {
		background: var(--color-primary);
		border-color: var(--color-primary);
	}

	.step__dot.is-next {
		background: var(--color-primary-soft);
		border: 2px solid var(--color-primary);
	}

	.step__inner {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-primary);
	}

	.step__label {
		font-size: 0.7rem;
		color: var(--color-text-subtle);
		text-align: center;
		line-height: 1.2;
	}

	.step__label.is-done {
		color: var(--color-primary);
		font-weight: 600;
	}

	.step__label.is-next {
		color: #334155;
		font-weight: 600;
	}

	.step__time {
		color: var(--color-text-muted);
		font-weight: 400;
	}

	.step__line {
		flex: 1;
		height: 2px;
		background: var(--color-border);
		margin-top: 14px;
	}

	.step__line.is-done {
		background: var(--color-primary);
	}

	.action {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.action :global(.btn--lg) {
		width: 100%;
		font-size: 1.0625rem;
		padding: 1rem 2.5rem;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-primary);
	}

	.done-box {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: var(--color-success-bg);
		color: var(--color-success);
		border-radius: var(--radius-md);
		padding: 1rem 1.5rem;
		width: 100%;
		font-weight: 600;
		font-size: 1rem;
	}

	.success-toast {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-success-bg);
		color: #15803d;
		padding: 0.5rem 1rem;
		border-radius: var(--radius-pill);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.qr-title {
		margin: 0 0 0.5rem;
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.qr-hint {
		color: var(--color-text-muted);
		font-size: 0.85rem;
		margin: 0 0 0.75rem;
	}

	.scanner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.scanner video {
		width: 100%;
		max-width: 320px;
		border-radius: var(--radius-sm);
		background: #000;
	}

	.manual {
		margin-top: 0.75rem;
	}

	.manual summary {
		cursor: pointer;
		color: var(--color-text-muted);
		font-size: 0.85rem;
		margin-bottom: 0.5rem;
	}

	.manual textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		font-family: monospace;
		font-size: 0.8rem;
		margin-bottom: 0.75rem;
		resize: vertical;
	}

	.list-title {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.875rem;
	}

	.punches {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.punch {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--color-surface);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border-soft);
	}

	.punch__left {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.punch__dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.punch__type {
		font-weight: 600;
		color: #334155;
		font-size: 0.9rem;
	}

	.punch__time {
		font-weight: 700;
		color: var(--color-text);
		font-variant-numeric: tabular-nums;
		font-size: 0.9375rem;
	}

	.empty {
		text-align: center;
		color: var(--color-text-subtle);
	}

	.error {
		background: var(--color-danger-bg);
		color: var(--color-danger);
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		text-align: center;
	}
</style>
