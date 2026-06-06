/**
 * @module services/punch-admin
 * @description Operações administrativas sobre batidas — somente para perfil admin.
 *
 * Conformidade Portaria 671/2021: nenhuma operação altera ou remove batidas
 * existentes. `criarManual` adiciona um novo registro retroativo; `anular`
 * cria um registro paralelo que invalida a batida no cálculo, mantendo
 * a original visível para o AFD legal.
 */

import { post } from './api';
import type { PunchRecord, PunchType } from './timesheet.service';

export const punchAdminService = {
	criarManual: (data: {
		colaboradorId: string;
		type: PunchType;
		timestamp: string;
		reason: string;
	}) => post<PunchRecord>('/timesheet/punch/manual', data),

	anular: (punchId: string, motivo: string) =>
		post<PunchRecord>(`/timesheet/punch/${punchId}/anular`, { motivo })
};
