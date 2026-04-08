/**
 * @module services/jornada.service
 * @description Operações de gerenciamento de jornadas de trabalho.
 */

import { get, post, put, del } from './api';
import { mockJornadaService } from './mock/jornada.mock';

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
  entrada: string;        // "HH:MM"
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

export interface JornadaService {
  list(): Promise<Jornada[]>;
  create(data: JornadaInput): Promise<Jornada>;
  update(id: string, data: JornadaInput): Promise<Jornada>;
  remove(id: string): Promise<void>;
}

const USE_MOCK = !import.meta.env.VITE_API_URL || import.meta.env.VITE_USE_MOCK === 'true';

const realJornadaService: JornadaService = {
  list: () => get<Jornada[]>('/jornadas'),
  create: (data) => post<Jornada>('/jornadas', data),
  update: (id, data) => put<Jornada>(`/jornadas/${id}`, data),
  remove: (id) => del<void>(`/jornadas/${id}`)
};

export const jornadaService: JornadaService = USE_MOCK ? mockJornadaService : realJornadaService;
