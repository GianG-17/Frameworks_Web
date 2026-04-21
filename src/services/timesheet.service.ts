/**
 * @module services/timesheet.service
 * @description Operações de registro e consulta de ponto.
 */

import { post, get } from './api';

export type PunchType = 'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida';

export interface PunchRecord {
  id: string;
  userId: string;
  type: PunchType;
  timestamp: string;
  latitude?: number | null;
  longitude?: number | null;
  method: 'qrcode' | 'manual';
}

export interface DailySummary {
  date: string;
  punches: PunchRecord[];
  totalHours: number;
  overtime: number;
  deficit: number;
}

export const timesheetService = {
  punch: (data: { type: PunchType; method: PunchRecord['method'] }) =>
    post<PunchRecord>('/timesheet/punch', data),

  today: () => get<DailySummary>('/timesheet/today'),

  history: (params: { startDate: string; endDate: string }) =>
    get<DailySummary[]>(
      `/timesheet/history?startDate=${params.startDate}&endDate=${params.endDate}`
    )
};
