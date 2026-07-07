/**
 * @module services/jornada.service
 * @description Operações de gerenciamento de jornadas de trabalho.
 */

import { get, post, put, del } from './api';

export type DiaSemanaKey =
	| 'segunda'
	| 'terca'
	| 'quarta'
	| 'quinta'
	| 'sexta'
	| 'sabado'
	| 'domingo';

export interface DiaSemana {
	ativo: boolean;
	entrada: string;
	saida_almoco: string;
	retorno_almoco: string;
	saida: string;
}

/** Versão de horário com data de vigência (YYYY-MM-DD). */
export interface JornadaVersao {
	vigenciaInicio: string;
	dias: Record<DiaSemanaKey, DiaSemana>;
}

export interface Jornada {
	id: string;
	nome: string;
	/** Horário vigente hoje. */
	dias: Record<DiaSemanaKey, DiaSemana>;
	/** Histórico de versões, em ordem crescente de vigência. */
	versoes: JornadaVersao[];
}

export type JornadaInput = Omit<Jornada, 'id' | 'versoes'> & {
	/** Data (YYYY-MM-DD) a partir da qual o horário vale. Default: amanhã (edição) / hoje (criação). */
	vigenciaInicio?: string;
};

export const jornadaService = {
	list: () => get<Jornada[]>('/jornadas'),
	create: (data: JornadaInput) => post<Jornada>('/jornadas', data),
	update: (id: string, data: JornadaInput) => put<Jornada>(`/jornadas/${id}`, data),
	remove: (id: string) => del<void>(`/jornadas/${id}`)
};
