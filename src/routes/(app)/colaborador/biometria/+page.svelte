<!--
  @page /colaborador/biometria
  @description Status da biometria do colaborador. O cadastro em si é feito no
  leitor (o aparelho informa o CPF); esta tela apenas mostra a situação e
  atualiza sozinha quando a digital é vinculada.
-->
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Card from '@/components/ui/Card.svelte';
	import Badge from '@/components/ui/Badge.svelte';
	import Icon from '@/components/ui/Icon.svelte';
	import { user } from '@/store/auth.store';
	import { biometriaService, type BiometriaStatus } from '@/services/biometria.service';

	let status = $state<BiometriaStatus | null>(null);
	let loading = $state(true);
	let errorMsg = $state('');

	let pollTimer: ReturnType<typeof setInterval> | null = null;

	const cadastrada = $derived(status?.biometriaId != null);

	async function loadStatus(): Promise<void> {
		try {
			status = await biometriaService.status();
			errorMsg = '';
		} catch {
			errorMsg = 'Erro ao carregar o status da biometria.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadStatus();
		// Atualiza sozinho para refletir o cadastro feito no leitor.
		pollTimer = setInterval(loadStatus, 4000);
	});

	onDestroy(() => {
		if (pollTimer) clearInterval(pollTimer);
	});
</script>

<svelte:head>
	<title>Biometria — Ponto Digital</title>
</svelte:head>

<section class="bio">
	<Card>
		<div class="head">
			<span class="head__icon"><Icon name="fingerprint" size={26} /></span>
			<div>
				<h1 class="head__title">Biometria</h1>
				<p class="head__sub">Situação da sua digital para registrar o ponto no leitor.</p>
			</div>
		</div>

		<div class="status">
			<span class="status__label">Status</span>
			{#if loading}
				<Badge variant="neutral" dot>Carregando…</Badge>
			{:else if cadastrada}
				<Badge variant="success" dot>Cadastrada (ID {status?.biometriaId})</Badge>
			{:else}
				<Badge variant="warning" dot>Não cadastrada</Badge>
			{/if}
		</div>
	</Card>

	{#if errorMsg}
		<div class="error" role="alert">{errorMsg}</div>
	{/if}

	{#if !loading && !cadastrada}
		<Card>
			<h2 class="how__title">Como cadastrar</h2>
			<ol class="how">
				<li>Vá até o leitor biométrico.</li>
				<li>
					Informe seu CPF{#if $user?.cpf}&nbsp;(<strong>{$user.cpf}</strong>){/if} no aparelho.
				</li>
				<li>Cadastre sua digital. Esta tela atualiza sozinha quando concluir.</li>
			</ol>
		</Card>
	{/if}
</section>

<style>
	.bio {
		max-width: 480px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.head {
		display: flex;
		align-items: center;
		gap: 0.875rem;
	}

	.head__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: var(--radius-md);
		background: var(--color-primary-soft);
		color: var(--color-primary);
		flex-shrink: 0;
	}

	.head__title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}

	.head__sub {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin: 0.15rem 0 0;
	}

	.status {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border-soft);
	}

	.status__label {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.how__title {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.75rem;
	}

	.how {
		margin: 0;
		padding-left: 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.error {
		background: var(--color-danger-bg);
		color: var(--color-danger);
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		text-align: center;
	}
</style>
