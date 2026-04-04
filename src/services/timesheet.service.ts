/**
 * @module services/timesheet.service
 * @description Operações de registro e consulta de ponto.
 */

import { post, get } from './api';
import { timesheetMockService } from './mock/timesheet.mock';

export type PunchType = 'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida';

export interface PunchRecord {
  id: string;
  userId: string;
  type: PunchType;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  method: 'qrcode' | 'manual';
}

export interface DailySummary {
  date: string;
  punches: PunchRecord[];
  totalHours: number;
  overtime: number;
  deficit: number;
}

const USE_MOCK = !import.meta.env.VITE_API_URL || import.meta.env.VITE_USE_MOCK === 'true';

const realTimesheetService = {
  punch: (data: { type: PunchType; method: PunchRecord['method'] }) =>
    post<PunchRecord>('/timesheet/punch', data),

  today: () =>
    get<DailySummary>('/timesheet/today'),

  history: (params: { startDate: string; endDate: string }) =>
    get<DailySummary[]>(`/timesheet/history?start=${params.startDate}&end=${params.endDate}`)
};

export const timesheetService = USE_MOCK ? timesheetMockService : realTimesheetService;
