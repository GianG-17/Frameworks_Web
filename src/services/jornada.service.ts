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

export interface Jornada {
  id: string;
  nome: string;
  dias: Record<DiaSemanaKey, DiaSemana>;
}

export type JornadaInput = Omit<Jornada, 'id'>;

export const jornadaService = {
  list: () => get<Jornada[]>('/jornadas'),
  create: (data: JornadaInput) => post<Jornada>('/jornadas', data),
  update: (id: string, data: JornadaInput) => put<Jornada>(`/jornadas/${id}`, data),
  remove: (id: string) => del<void>(`/jornadas/${id}`)
};
