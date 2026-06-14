/**
 * @module lib/server/timesheet
 * @description Utilitários server-side para cálculo de resumo diário de ponto.
 *
 * Conformidade com Portaria 671/2021:
 *  - Registros são imutáveis.
 *  - Correções via batidas manuais (createdBy) ou anulações (RegistroAnulacao).
 *  - Cálculo ignora batidas anuladas, mas o DTO continua expondo a anulação
 *    para que o front exiba a marcação visual e o AFD futuro liste tudo.
 */

import type { Registro, RegistroAnulacao } from '@/lib/server/prisma-client/client';

export interface AnulacaoDTO {
	motivo: string;
	anuladoPor: string;
	anuladoEm: string;
}

export interface RegistroDTO {
	id: string;
	colaboradorId: string;
	type: string;
	timestamp: string;
	method: string;
	createdBy: string | null;
	createdReason: string | null;
	anulacao: AnulacaoDTO | null;
}

export interface DailySummaryDTO {
	date: string;
	registros: RegistroDTO[];
	totalHours: number;
	overtime: number;
	deficit: number;
	abonado: boolean;
}

export type RegistroComAnulacao = Registro & { anulacao?: RegistroAnulacao | null };

export function toRegistroDTO(p: RegistroComAnulacao): RegistroDTO {
	return {
		id: p.id,
		colaboradorId: p.colaboradorId,
		type: p.type,
		timestamp: p.timestamp.toISOString(),
		method: p.method,
		createdBy: p.createdBy ?? null,
		createdReason: p.createdReason ?? null,
		anulacao: p.anulacao
			? {
					motivo: p.anulacao.motivo,
					anuladoPor: p.anulacao.anuladoPor,
					anuladoEm: p.anulacao.anuladoEm.toISOString()
				}
			: null
	};
}

export function dateKey(date: Date): string {
	return date.toISOString().split('T')[0];
}

/** Ordem fixa das batidas em um dia. */
export const REGISTRO_SEQUENCE = ['entrada', 'saida_almoco', 'retorno_almoco', 'saida'] as const;

/**
 * Determina o próximo tipo de batida esperado a partir dos registros (válidos) do dia.
 * Ignora batidas anuladas. Retorna `null` quando os 4 tipos já foram registrados.
 * Usado pela marcação biométrica, em que o dispositivo não envia o tipo.
 */
export function proximoTipo(
	registros: RegistroComAnulacao[]
): (typeof REGISTRO_SEQUENCE)[number] | null {
	const registrados = new Set(registros.filter((p) => !p.anulacao).map((p) => p.type));
	return REGISTRO_SEQUENCE.find((type) => !registrados.has(type)) ?? null;
}

/**
 * Agrupa pontos por data e calcula totalHours / overtime / deficit por dia.
 * Regra: totalHours = (saida_almoco - entrada) + (saida - retorno_almoco) em horas decimais.
 * Batidas anuladas são exibidas no DTO mas ignoradas no cálculo.
 * Se faltar qualquer um dos 4 tipos válidos, totalHours = 0. Jornada base: 8h/dia.
 * Dias com justificativa aprovada (abonado) têm deficit zerado.
 */
export function buildDailySummaries(
	registros: RegistroComAnulacao[],
	datasAbonadas: Set<string> = new Set()
): DailySummaryDTO[] {
	const byDay = new Map<string, RegistroComAnulacao[]>();

	for (const p of registros) {
		const key = dateKey(p.timestamp);
		const list = byDay.get(key) ?? [];
		list.push(p);
		byDay.set(key, list);
	}

	const summaries: DailySummaryDTO[] = [];
	for (const [date, dayRegistros] of byDay.entries()) {
		dayRegistros.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
		summaries.push(buildSummary(date, dayRegistros, datasAbonadas.has(date)));
	}

	summaries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
	return summaries;
}

export function buildSummary(
	date: string,
	registros: RegistroComAnulacao[],
	abonado = false
): DailySummaryDTO {
	const validas = registros.filter((p) => !p.anulacao);
	const byType = new Map(validas.map((p) => [p.type, p]));
	const entrada = byType.get('entrada');
	const saidaAlmoco = byType.get('saida_almoco');
	const retornoAlmoco = byType.get('retorno_almoco');
	const saida = byType.get('saida');

	let totalHours = 0;
	if (entrada && saidaAlmoco && retornoAlmoco && saida) {
		const manha = (saidaAlmoco.timestamp.getTime() - entrada.timestamp.getTime()) / 3_600_000;
		const tarde = (saida.timestamp.getTime() - retornoAlmoco.timestamp.getTime()) / 3_600_000;
		totalHours = Number((manha + tarde).toFixed(2));
	}

	const JORNADA_BASE = 8;
	const overtime = Math.max(0, Number((totalHours - JORNADA_BASE).toFixed(2)));
	const deficit = abonado
		? 0
		: totalHours > 0
			? Math.max(0, Number((JORNADA_BASE - totalHours).toFixed(2)))
			: 0;

	return {
		date,
		registros: registros.map(toRegistroDTO),
		totalHours,
		overtime,
		deficit,
		abonado
	};
}
