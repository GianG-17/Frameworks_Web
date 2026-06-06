/**
 * @module services/registro-admin
 * @description Operações administrativas sobre registros de ponto — somente para perfil admin.
 *
 * Conformidade Portaria 671/2021: nenhuma operação altera ou remove batidas
 * existentes. `criarManual` adiciona um novo registro retroativo; `anular`
 * cria um registro paralelo que invalida a batida no cálculo, mantendo
 * a original visível para o AFD legal.
 */

import { post } from './api';
import type { RegistroRecord, RegistroType } from './timesheet.service';

export const registroAdminService = {
	criarManual: (data: {
		colaboradorId: string;
		type: RegistroType;
		timestamp: string;
		reason: string;
	}) => post<RegistroRecord>('/timesheet/registro/manual', data),

	anular: (registroId: string, motivo: string) =>
		post<RegistroRecord>(`/timesheet/registro/${registroId}/anular`, { motivo })
};
