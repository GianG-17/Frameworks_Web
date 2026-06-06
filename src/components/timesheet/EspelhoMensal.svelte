<!--
  @component EspelhoMensal
  @description Grid mensal de batidas para um colaborador.

  Cada linha = um dia do mês. Colunas = Entrada / Saída Almoço / Retorno / Saída / Total.
  Click em célula vazia → abre modal para registrar batida manual.
  Click em batida existente → abre modal para anular (Portaria 671: não há edição).
-->
<script lang="ts">
	import { relatorioService, type EspelhoRelatorio } from '@/services/relatorio.service';
	import { registroAdminService } from '@/services/registro-admin.service';
	import type { RegistroRecord, RegistroType, DailySummary } from '@/services/timesheet.service';
	import RegistroManualModal from './RegistroManualModal.svelte';
	import RegistroAnularModal from './RegistroAnularModal.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	interface Props {
		colaboradorId: string;
		colaboradorNome: string;
		/** Mês no formato YYYY-MM */
		mes: string;
	}

	let { colaboradorId, colaboradorNome, mes }: Props = $props();

	const TIPOS_ORDEM: RegistroType[] = ['entrada', 'saida_almoco', 'retorno_almoco', 'saida'];
	const TIPO_LABEL: Record<RegistroType, string> = {
		entrada: 'Entrada 1',
		saida_almoco: 'Saída 1',
		retorno_almoco: 'Entrada 2',
		saida: 'Saída 2'
	};
	const DIA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

	let espelho = $state<EspelhoRelatorio | null>(null);
	let carregando = $state(false);
	let erro = $state('');

	let modalManualAberto = $state(false);
	let modalAnularAberto = $state(false);
	let dataInicialModal = $state('');
	let tipoInicialModal = $state<RegistroType>('entrada');
	let registroSelecionado = $state<RegistroRecord | null>(null);

	/** Gera a lista de dias do mês com batidas mescladas. */
	let dias = $derived.by(() => {
		if (!mes) return [];
		const [ano, mm] = mes.split('-').map(Number);
		const totalDias = new Date(ano, mm, 0).getDate();
		const mapa = new SvelteMap<string, DailySummary>();
		if (espelho) {
			for (const d of espelho.dias) mapa.set(d.date, d);
		}
		const out: Array<{
			date: string;
			diaSemana: number;
			diaNum: number;
			summary: DailySummary | null;
			isFimSemana: boolean;
		}> = [];
		for (let d = 1; d <= totalDias; d++) {
			const date = `${ano}-${String(mm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			const dt = new Date(`${date}T12:00:00`);
			const dow = dt.getDay();
			out.push({
				date,
				diaSemana: dow,
				diaNum: d,
				summary: mapa.get(date) ?? null,
				isFimSemana: dow === 0 || dow === 6
			});
		}
		return out;
	});

	async function carregar() {
		if (!colaboradorId || !mes) return;
		carregando = true;
		erro = '';
		try {
			const [ano, mm] = mes.split('-').map(Number);
			const ultimoDia = new Date(ano, mm, 0).getDate();
			const inicio = `${mes}-01`;
			const fim = `${mes}-${String(ultimoDia).padStart(2, '0')}`;
			espelho = await relatorioService.espelho({ colaboradorId, inicio, fim });
		} catch {
			erro = 'Falha ao carregar espelho.';
			espelho = null;
		} finally {
			carregando = false;
		}
	}

	$effect(() => {
		if (colaboradorId && mes) carregar();
	});

	function batidaDoDia(summary: DailySummary | null, tipo: RegistroType): RegistroRecord | null {
		if (!summary) return null;
		// Pega a primeira não-anulada do tipo; se todas anuladas, pega a última anulada (pra exibir).
		const validas = summary.registros.filter((p) => p.type === tipo && !p.anulacao);
		if (validas.length > 0) return validas[0];
		const anuladas = summary.registros.filter((p) => p.type === tipo && p.anulacao);
		return anuladas[anuladas.length - 1] ?? null;
	}

	function formatHora(iso: string): string {
		return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
	}

	function formatDataCurta(date: string): string {
		const [, mm, dd] = date.split('-');
		return `${dd}/${mm}`;
	}

	function formatTotalHoras(horas: number): string {
		const totalMin = Math.round(horas * 60);
		const hh = Math.floor(totalMin / 60);
		const mm = totalMin % 60;
		return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
	}

	function abrirModalManual(date: string, tipo: RegistroType) {
		// Pré-preenche com horário sugerido por tipo
		const horarioPadrao: Record<RegistroType, string> = {
			entrada: '08:00',
			saida_almoco: '12:00',
			retorno_almoco: '13:00',
			saida: '17:00'
		};
		dataInicialModal = `${date}T${horarioPadrao[tipo]}`;
		tipoInicialModal = tipo;
		modalManualAberto = true;
	}

	function abrirModalAnular(registro: RegistroRecord) {
		if (registro.anulacao) return; // já anulada
		registroSelecionado = registro;
		modalAnularAberto = true;
	}

	async function confirmarManual(dados: { type: RegistroType; timestamp: string; reason: string }) {
		await registroAdminService.criarManual({ colaboradorId, ...dados });
		modalManualAberto = false;
		await carregar();
	}

	async function confirmarAnular(motivo: string) {
		if (!registroSelecionado) return;
		await registroAdminService.anular(registroSelecionado.id, motivo);
		modalAnularAberto = false;
		registroSelecionado = null;
		await carregar();
	}
</script>

{#if carregando}
	<p class="status">Carregando espelho…</p>
{:else if erro}
	<div class="erro">{erro}</div>
{:else if espelho}
	<div class="totais">
		<span><strong>{espelho.totais.horas}h</strong> trabalhadas</span>
		<span class="extra"><strong>{espelho.totais.extras}h</strong> extras</span>
		<span class="deficit"><strong>{espelho.totais.deficit}h</strong> déficit</span>
	</div>

	<div class="legenda">
		<span class="leg leg--ok">Ponto válido</span>
		<span class="leg leg--manual">Ponto manual</span>
		<span class="leg leg--anulada">Ponto anulado</span>
	</div>

	<div class="grid-wrap">
		<table class="grid">
			<thead>
				<tr>
					<th class="col-data">Data</th>
					{#each TIPOS_ORDEM as t (t)}<th class="col-batida">{TIPO_LABEL[t]}</th>{/each}
					<th class="col-total">Total</th>
				</tr>
			</thead>
			<tbody>
				{#each dias as dia (dia.date)}
					<tr class:fim-semana={dia.isFimSemana}>
						<td class="dia">
							<span class="dia-num">{formatDataCurta(dia.date)}</span>
							<span class="dia-sem">{DIA_SEMANA[dia.diaSemana]}</span>
						</td>
						{#each TIPOS_ORDEM as tipo (tipo)}
							{@const registro = batidaDoDia(dia.summary, tipo)}
							{#if registro}
								<td class="cel">
									<button
										type="button"
										class="batida"
										class:batida--manual={registro.method === 'manual'}
										class:batida--anulada={!!registro.anulacao}
										title={registro.anulacao
											? `Anulada: ${registro.anulacao.motivo}`
											: (registro.createdReason ?? 'Clique para anular')}
										onclick={() => abrirModalAnular(registro)}
										disabled={!!registro.anulacao}
									>
										{formatHora(registro.timestamp)}
									</button>
								</td>
							{:else}
								<td class="cel">
									<button
										type="button"
										class="vazia"
										title="Adicionar batida manual"
										onclick={() => abrirModalManual(dia.date, tipo)}>+</button
									>
								</td>
							{/if}
						{/each}
						<td class="total">{formatTotalHoras(dia.summary?.totalHours ?? 0)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<RegistroManualModal
	aberto={modalManualAberto}
	{colaboradorNome}
	dataInicial={dataInicialModal}
	tipoInicial={tipoInicialModal}
	onFechar={() => (modalManualAberto = false)}
	onConfirmar={confirmarManual}
/>

<RegistroAnularModal
	aberto={modalAnularAberto}
	registro={registroSelecionado}
	onFechar={() => {
		modalAnularAberto = false;
		registroSelecionado = null;
	}}
	onConfirmar={confirmarAnular}
/>

<style>
	.status,
	.erro {
		padding: 1rem;
		border-radius: 0.5rem;
		text-align: center;
	}
	.erro {
		background: #fef2f2;
		color: #b91c1c;
	}
	.status {
		color: #64748b;
	}

	.totais {
		display: flex;
		gap: 2rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		color: #334155;
	}
	.totais .extra {
		color: #059669;
	}
	.totais .deficit {
		color: #dc2626;
	}

	.legenda {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.75rem;
		color: #64748b;
		margin-bottom: 0.75rem;
	}

	.grid-wrap {
		overflow-x: auto;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
	}
	.grid {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		background: #fff;
		table-layout: fixed;
	}
	.col-data {
		width: 90px;
	}
	.col-batida {
		width: auto;
	}
	.col-total {
		width: 80px;
	}
	.grid th {
		background: #f8fafc;
		text-align: center;
		padding: 0.625rem 0.75rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		color: #64748b;
		border-bottom: 1px solid #e2e8f0;
		position: sticky;
		top: 0;
	}
	.grid td {
		padding: 0.375rem 0.5rem;
		border-bottom: 1px solid #f1f5f9;
		vertical-align: middle;
	}
	.grid tr.fim-semana td {
		background: #fafbfc;
	}
	.grid tr.fim-semana td.dia .dia-sem {
		color: #ef4444;
	}

	.dia {
		white-space: nowrap;
	}
	.dia-num {
		font-weight: 600;
		color: #111;
		margin-right: 0.375rem;
	}
	.dia-sem {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.cel {
		padding: 0.25rem;
	}
	.batida {
		width: 100%;
		padding: 0.375rem 0.5rem;
		background: #ecfdf5;
		color: #065f46;
		border: 1px solid #a7f3d0;
		border-radius: 0.375rem;
		font-size: 0.825rem;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		justify-content: center;
	}
	.batida:hover:not(:disabled) {
		background: #d1fae5;
	}
	.batida--manual {
		background: #fef3c7;
		color: #92400e;
		border-color: #fcd34d;
	}
	.batida--manual:hover:not(:disabled) {
		background: #fde68a;
	}
	.batida--anulada {
		background: #f1f5f9;
		color: #94a3b8;
		border-color: #e2e8f0;
		text-decoration: line-through;
		cursor: not-allowed;
	}
	.batida .ico {
		font-size: 0.7rem;
	}

	.vazia {
		width: 100%;
		padding: 0.375rem 0.5rem;
		background: transparent;
		color: #cbd5e1;
		border: 1px dashed #e2e8f0;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
	}
	.vazia:hover {
		background: #eff6ff;
		color: #3b82f6;
		border-color: #93c5fd;
	}

	.total {
		font-weight: 600;
		color: #334155;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	.leg {
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
	}
	.leg--vazia {
		color: #94a3b8;
	}
	.leg--ok {
		background: #ecfdf5;
		color: #065f46;
		border-color: #a7f3d0;
	}
	.leg--manual {
		background: #fef3c7;
		color: #92400e;
		border-color: #fcd34d;
	}
	.leg--anulada {
		background: #f1f5f9;
		color: #94a3b8;
		border-color: #e2e8f0;
		text-decoration: line-through;
	}
</style>
