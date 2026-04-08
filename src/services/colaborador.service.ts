// src/services/colaborador.service.ts

import { get, post, put, del } from './api';
import type { Colaborador, ColaboradorFormData } from '../types/colaborador';

export const colaboradorService = {
  listar: () => get<Colaborador[]>('/colaboradores'),

  buscarPorId: (id: string) => get<Colaborador>(`/colaboradores/${id}`),

  criar: (dados: ColaboradorFormData) => post<Colaborador>('/colaboradores', dados),

  atualizar: (id: string, dados: Partial<ColaboradorFormData>) =>
    put<Colaborador>(`/colaboradores/${id}`, dados),

  remover: (id: string) => del<void>(`/colaboradores/${id}`)
};