<!--
  @component PunchAnularModal
  @description Modal para admin anular uma batida existente.
  Conformidade Portaria 671: cria registro de anulação paralelo. A batida
  original é mantida no banco e exibida no histórico/AFD.
-->
<script lang="ts">
	import type { PunchRecord } from '@/services/timesheet.service';

	interface Props {
		aberto: boolean;
		punch: PunchRecord | null;
		onFechar: () => void;
		onConfirmar: (motivo: string) => Promise<void>;
	}

	let { aberto, punch, onFechar, onConfirmar }: Props = $props();

	let motivo = $state('');
	let salvando = $state(false);
	let erro = $state('');

	$effect(() => {
		if (aberto) {
			motivo = '';
			erro = '';
		}
	});

	const tipoLabel: Record<string, string> = {
		entrada: 'Entrada',
		saida_almoco: 'Saída para almoço',
		retorno_almoco: 'Retorno do almoço',
		saida: 'Saída'
	};

	function formatHora(iso: string) {
		const d = new Date(iso);
		return d.toLocaleString('pt-BR');
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		erro = '';
		if (motivo.trim().length < 5) {
			erro = 'Informe um motivo com ao menos 5 caracteres.';
			return;
		}
		salvando = true;
		try {
			await onConfirmar(motivo.trim());
		} catch {
			erro = 'Falha ao anular batida. Tente novamente.';
		} finally {
			salvando = false;
		}
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget && !salvando) onFechar();
	}
</script>

{#if aberto && punch}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={handleBackdrop}>
		<form class="modal" role="dialog" aria-modal="true" onsubmit={handleSubmit}>
			<header class="modal-header">
				<h2>Anular Marcação</h2>
				<button type="button" class="btn-fechar" onclick={onFechar} aria-label="Fechar">✕</button>
			</header>

			<div class="modal-body">
				<dl class="info">
					<div>
						<dt>Tipo</dt>
						<dd>{tipoLabel[punch.type] ?? punch.type}</dd>
					</div>
					<div>
						<dt>Data/hora</dt>
						<dd>{formatHora(punch.timestamp)}</dd>
					</div>
					<div>
						<dt>Origem</dt>
						<dd>{punch.method === 'manual' ? 'Manual' : 'QR Code'}</dd>
					</div>
				</dl>

				<div class="campo">
					<label for="motivo">Motivo*</label>
					<textarea
						id="motivo"
						bind:value={motivo}
						rows="3"
						placeholder="Ex.: Marcação duplicada — colaborador clicou duas vezes."
						required
					></textarea>
				</div>

				{#if erro}<div class="erro" role="alert">{erro}</div>{/if}
			</div>

			<footer class="modal-footer">
				<button type="button" class="btn btn--secundario" onclick={onFechar} disabled={salvando}>
					Cancelar
				</button>
				<button type="submit" class="btn btn--perigo" disabled={salvando}>
					{salvando ? 'Anulando...' : 'Confirmar'}
				</button>
			</footer>
		</form>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		padding: 1rem;
	}
	.modal {
		background: #fff;
		border-radius: 0.75rem;
		width: 100%;
		max-width: 480px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
	}
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem 0;
	}
	.modal-header h2 {
		margin: 0;
		font-size: 1.15rem;
	}
	.btn-fechar {
		background: none;
		border: none;
		font-size: 1.125rem;
		color: #64748b;
		cursor: pointer;
		padding: 0.25rem;
	}
	.modal-body {
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.aviso {
		font-size: 0.825rem;
		color: #475569;
		background: #fef2f2;
		border-left: 3px solid #ef4444;
		padding: 0.625rem 0.75rem;
		border-radius: 0.375rem;
		margin: 0;
		line-height: 1.4;
	}
	.info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		background: #f8fafc;
		padding: 0.75rem;
		border-radius: 0.5rem;
		margin: 0;
		font-size: 0.875rem;
	}
	.info > div {
		display: flex;
		gap: 0.5rem;
	}
	.info dt {
		color: #64748b;
		min-width: 90px;
		margin: 0;
	}
	.info dd {
		margin: 0;
		color: #111;
		font-weight: 500;
	}
	.campo {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #111;
	}
	textarea {
		padding: 0.5rem 0.75rem;
		border: 1.5px solid #e2e8f0;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		background: #f8fafc;
		font-family: inherit;
	}
	textarea:focus {
		outline: none;
		border-color: #3b82f6;
		background: #fff;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	.erro {
		background: #fef2f2;
		color: #b91c1c;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.825rem;
	}
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 0.75rem 1.5rem 1.25rem;
		border-top: 1px solid #e2e8f0;
	}
	.btn {
		padding: 0.5rem 1.125rem;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}
	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn--secundario {
		background: #e2e8f0;
		color: #111;
	}
	.btn--perigo {
		background: #dc2626;
		color: #fff;
	}
</style>
