/**
 * @module services/admin.service
 * @description Operações exclusivas do administrador (métricas agregadas).
 */

import { get } from './api';

export interface DashboardMetrics {
  colaboradoresAtivos: number;
  pontosHoje: number;
  totalColaboradores: number;
  horasExtrasMes: number;
}

export const adminService = {
  dashboard: () => get<DashboardMetrics>('/admin/dashboard')
};
