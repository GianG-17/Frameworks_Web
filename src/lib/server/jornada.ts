/**
 * @module lib/server/jornada
 * @description Tipos e cálculos de Jornada. O horário é versionado por vigência:
 * cada `JornadaVersao` vale a partir de `vigenciaInicio`. Cálculos dependentes de
 * data resolvem a versão vigente naquele dia, preservando o histórico quando o
 * horário muda. Campo `dias` é jsonb no Postgres.
 */

import type {
	Jornada as JornadaDB,
	JornadaVersao as JornadaVersaoDB
} from '@/lib/server/prisma-client/client';

export interface DiaSemanaDTO {
	ativo: boolean;
	entrada: string;
	saida_almoco: string;
	retorno_almoco: string;
	saida: string;
}

export type DiaSemanaKey =
	| 'segunda'
	| 'terca'
	| 'quarta'
	| 'quinta'
	| 'sexta'
	| 'sabado'
	| 'domingo';

export type DiasSemana = Record<DiaSemanaKey, DiaSemanaDTO>;

export interface JornadaVersaoDTO {
	/** Data (YYYY-MM-DD) a partir da qual esta versão vale. */
	vigenciaInicio: string;
	dias: DiasSemana;
}

export interface JornadaDTO {
	id: string;
	nome: string;
	/** Versão vigente hoje (compat com a UI atual). */
	dias: DiasSemana;
	/** Histórico de versões, em ordem crescente de vigência. */
	versoes: JornadaVersaoDTO[];
}

/** Linha de versão necessária para os cálculos (vigência + dias). */
export interface VersaoVigencia {
	vigenciaInicio: Date;
	dias: unknown;
}

const DIAS_VAZIOS: DiasSemana = {
	segunda: diaVazio(),
	terca: diaVazio(),
	quarta: diaVazio(),
	quinta: diaVazio(),
	sexta: diaVazio(),
	sabado: diaVazio(),
	domingo: diaVazio()
};

function diaVazio(): DiaSemanaDTO {
	return { ativo: false, entrada: '', saida_almoco: '', retorno_almoco: '', saida: '' };
}

// ── Helpers de data (fuso de Brasília, UTC-3) ────────────────────────────────
const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Data de hoje (calendário BRT) à meia-noite UTC — compatível com `@db.Date`. */
export function dataHojeUTC(): Date {
	const brt = new Date(Date.now() - BRT_OFFSET_MS);
	return new Date(Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), brt.getUTCDate()));
}

/** Data de amanhã (calendário BRT) à meia-noite UTC. */
export function dataAmanhaUTC(): Date {
	const h = dataHojeUTC();
	return new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth(), h.getUTCDate() + 1));
}

function toDateString(d: Date): string {
	return d.toISOString().split('T')[0];
}

/**
 * Converte uma string `YYYY-MM-DD` para `Date` à meia-noite UTC (formato `@db.Date`).
 * Retorna `null` se o formato for inválido ou a data não existir.
 */
export function parseDataUTC(s: string): Date | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
	if (!m) return null;
	const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
	const d = new Date(Date.UTC(ano, mes - 1, dia));
	if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) {
		return null;
	}
	return d;
}

/**
 * Resolve o horário (dias) vigente em `data`: a versão de maior `vigenciaInicio`
 * que seja <= data. Se nenhuma (data anterior à 1ª versão), usa a versão mais
 * antiga — assim nenhum dia fica sem horário. Retorna null se não houver versões.
 */
export function versaoVigenteEm(versoes: VersaoVigencia[], data: Date): DiasSemana | null {
	if (versoes.length === 0) return null;

	let escolhida: VersaoVigencia | null = null;
	let maisAntiga: VersaoVigencia | null = null;
	for (const v of versoes) {
		if (!maisAntiga || v.vigenciaInicio.getTime() < maisAntiga.vigenciaInicio.getTime()) {
			maisAntiga = v;
		}
		if (v.vigenciaInicio.getTime() <= data.getTime()) {
			if (!escolhida || v.vigenciaInicio.getTime() > escolhida.vigenciaInicio.getTime()) {
				escolhida = v;
			}
		}
	}

	const fonte = escolhida ?? maisAntiga;
	return fonte ? (fonte.dias as DiasSemana) : null;
}

export function toJornadaDTO(
	j: Pick<JornadaDB, 'id' | 'nome'> & {
		versoes: Pick<JornadaVersaoDB, 'vigenciaInicio' | 'dias'>[];
	}
): JornadaDTO {
	const versoes = [...j.versoes].sort(
		(a, b) => a.vigenciaInicio.getTime() - b.vigenciaInicio.getTime()
	);
	return {
		id: j.id,
		nome: j.nome,
		dias: versaoVigenteEm(versoes, dataHojeUTC()) ?? DIAS_VAZIOS,
		versoes: versoes.map((v) => ({
			vigenciaInicio: toDateString(v.vigenciaInicio),
			dias: v.dias as unknown as DiasSemana
		}))
	};
}

const DIAS_KEY: DiaSemanaKey[] = [
	'domingo',
	'segunda',
	'terca',
	'quarta',
	'quinta',
	'sexta',
	'sabado'
];

function minutosDoHorario(hhmm: string): number {
	const [h, m] = hhmm.split(':').map(Number);
	return (h || 0) * 60 + (m || 0);
}

function horasDoDia(d: DiaSemanaDTO): number {
	const manha = minutosDoHorario(d.saida_almoco) - minutosDoHorario(d.entrada);
	const tarde = minutosDoHorario(d.saida) - minutosDoHorario(d.retorno_almoco);
	return Math.max(0, (manha + tarde) / 60);
}

/**
 * Horas previstas no mês (decimal), resolvendo a versão vigente em cada dia —
 * assim editar o horário não altera meses passados. `mesNum` é 1-12.
 */
export function calcularHorasEsperadasMes(
	versoes: VersaoVigencia[],
	ano: number,
	mesNum: number
): number {
	const ultimoDia = new Date(Date.UTC(ano, mesNum, 0)).getUTCDate();
	let total = 0;
	for (let d = 1; d <= ultimoDia; d++) {
		const data = new Date(Date.UTC(ano, mesNum - 1, d));
		const dias = versaoVigenteEm(versoes, data);
		if (!dias) continue;
		const dia = dias[DIAS_KEY[data.getUTCDay()]];
		if (!dia?.ativo) continue;
		total += horasDoDia(dia);
	}
	return total;
}
