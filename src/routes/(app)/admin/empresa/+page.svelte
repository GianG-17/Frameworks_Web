<!--
  @page /admin/empresa
  @description Dados da empresa (nome, CNPJ, horários).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { empresaService, type Empresa } from '@/services/empresa.service';
	import { user as userStore } from '@/store/auth.store';
	import { get } from 'svelte/store';

	let empresa = $state<Empresa | null>(null);
	let salvando = $state(false);
	let errorMsg = $state('');

	let form = $state({ nome: '', cnpj: '', horaAbertura: '', horaFechamento: '' });

	async function loadEmpresa() {
		const user = get(userStore);
		if (!user) return;
		empresa = await empresaService.get(user.empresaId);
		form = {
			nome: empresa.nome,
			cnpj: empresa.cnpj ?? '',
			horaAbertura: empresa.horaAbertura,
			horaFechamento: empresa.horaFechamento
		};
	}

	async function salvar() {
		if (!empresa) return;
		salvando = true;
		errorMsg = '';
		try {
			empresa = await empresaService.update(empresa.id, {
				nome: form.nome,
				cnpj: form.cnpj || undefined,
				horaAbertura: form.horaAbertura,
				horaFechamento: form.horaFechamento
			});
		} catch {
			errorMsg = 'Erro ao salvar.';
		} finally {
			salvando = false;
		}
	}

	onMount(loadEmpresa);
</script>

<svelte:head><title>Empresa — Admin</title></svelte:head>

<section class="page">
	<h1>Empresa</h1>

	{#if errorMsg}<div class="error">{errorMsg}</div>{/if}

	<div class="grid">
		<div class="card">
			<h2>Dados e horários</h2>
			<label>Nome<input bind:value={form.nome} /></label>
			<label>CNPJ<input bind:value={form.cnpj} /></label>
			<div class="row">
				<label>Abertura<input type="time" bind:value={form.horaAbertura} /></label>
				<label>Fechamento<input type="time" bind:value={form.horaFechamento} /></label>
			</div>
			<button class="btn" disabled={salvando} onclick={salvar}>
				{salvando ? 'Salvando…' : 'Salvar'}
			</button>
		</div>
	</div>
</section>

<style>
	.page {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}
	h1 {
		margin: 0 0 1.5rem;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		max-width: 600px;
	}
	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 1.5rem;
	}
	.card h2 {
		margin: 0 0 1rem;
		font-size: 1.125rem;
	}
	label {
		display: block;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		color: #475569;
	}
	input {
		display: block;
		width: 100%;
		margin-top: 0.25rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.9rem;
	}
	.row {
		display: flex;
		gap: 0.75rem;
	}
	.row label {
		flex: 1;
	}
	.btn {
		margin-top: 0.5rem;
		padding: 0.625rem 1.25rem;
		background: var(--color-primary);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm);
		font-weight: 500;
		cursor: pointer;
	}
	.btn:disabled {
		opacity: 0.6;
	}
	.error {
		background: var(--color-danger-bg);
		color: var(--color-danger);
		padding: 0.75rem;
		border-radius: var(--radius-sm);
		margin-bottom: 1rem;
	}
</style>
