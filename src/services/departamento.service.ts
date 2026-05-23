/**
 * @module services/departamento.service
 * @description Operações de gerenciamento de Departamentos.
 */

import { get, post, put, del, patch } from './api';

export interface Departamento {
	id: string;
	nome: string;
}

export interface DepartamentoInput {
	nome: string;
}

export const departamentoService = {
	list: () => get<Departamento[]>('/departamentos'),
	create: (data: DepartamentoInput) => post<Departamento>('/departamentos', data),
	update: (id: string, data: DepartamentoInput) => put<Departamento>(`/departamentos/${id}`, data),
	remove: (id: string) => del<void>(`/departamentos/${id}`),
	setJornada: (id: string, jornadaId: string | null) =>
		patch<{ atualizados: number }>(`/departamentos/${id}/jornada`, { jornadaId })
};
