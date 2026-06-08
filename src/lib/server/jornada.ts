/**
 * @module lib/server/jornada
 * @description Tipos e cálculos de Jornada. Campo `dias` é jsonb no Postgres.
 */

import type { Jornada as JornadaDB } from '@/lib/server/prisma-client/client';

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

export interface JornadaDTO {
	id: string;
	nome: string;
	dias: Record<DiaSemanaKey, DiaSemanaDTO>;
}

export function toJornadaDTO(j: JornadaDB): JornadaDTO {
	return {
		id: j.id,
		nome: j.nome,
		dias: j.dias as unknown as Record<DiaSemanaKey, DiaSemanaDTO>
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

/** Horas previstas no mês para uma jornada (decimal). `mesNum` é 1-12. */
export function calcularHorasEsperadasMes(
	jornada: JornadaDTO,
	ano: number,
	mesNum: number
): number {
	const ultimoDia = new Date(ano, mesNum, 0).getDate();
	let total = 0;
	for (let d = 1; d <= ultimoDia; d++) {
		const dow = new Date(ano, mesNum - 1, d).getDay();
		const dia = jornada.dias[DIAS_KEY[dow]];
		if (!dia?.ativo) continue;
		total += horasDoDia(dia);
	}
	return total;
}
