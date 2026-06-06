/**
 * @module services/timesheet.service
 * @description Operações de registro e consulta de ponto.
 */

import { post, get } from './api';

export type RegistroType = 'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida';

export interface RegistroAnulacao {
	motivo: string;
	anuladoPor: string;
	anuladoEm: string;
}

export interface RegistroRecord {
	id: string;
	colaboradorId: string;
	type: RegistroType;
	timestamp: string;
	latitude?: number | null;
	longitude?: number | null;
	method: 'manual';
	createdBy: string | null;
	createdReason: string | null;
	anulacao: RegistroAnulacao | null;
}

export interface DailySummary {
	date: string;
	registros: RegistroRecord[];
	totalHours: number;
	overtime: number;
	deficit: number;
}

export const timesheetService = {
	registrar: (data: { type: RegistroType; method: RegistroRecord['method'] }) =>
		post<RegistroRecord>('/timesheet/registro', data),

	today: () => get<DailySummary>('/timesheet/today'),

	history: (params: { startDate: string; endDate: string }) =>
		get<DailySummary[]>(
			`/timesheet/history?startDate=${params.startDate}&endDate=${params.endDate}`
		)
};
