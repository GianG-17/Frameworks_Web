/**
 * @module services/ferias.service
 * @description Gestão de períodos de férias (admin).
 */

import { get, post, del } from './api';

export interface Ferias {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  dataInicio: string;
  dataFim: string;
  observacao: string | null;
}

export interface FeriasInput {
  colaboradorId: string;
  dataInicio: string;
  dataFim: string;
  observacao?: string;
}

export const feriasService = {
  list: () => get<Ferias[]>('/ferias'),
  create: (data: FeriasInput) => post<Ferias>('/ferias', data),
  remove: (id: string) => del<void>(`/ferias/${id}`)
};
