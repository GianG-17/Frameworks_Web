/**
 * @module services/justificativa.service
 * @description Gestão de justificativas de falta (admin).
 */

import { get, post, del } from './api';

export interface Justificativa {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  data: string;
  motivo: string;
  anexoUrl: string | null;
}

export interface JustificativaInput {
  colaboradorId: string;
  data: string;
  motivo: string;
  anexoUrl?: string;
}

export const justificativaService = {
  list: () => get<Justificativa[]>('/justificativas'),
  create: (data: JustificativaInput) => post<Justificativa>('/justificativas', data),
  remove: (id: string) => del<void>(`/justificativas/${id}`)
};
