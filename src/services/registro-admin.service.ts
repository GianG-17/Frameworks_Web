/**
 * @module services/registro-admin
 * @description Operações administrativas sobre registros de ponto — somente para perfil admin.
 *
 * Conformidade Portaria 671/2021: nenhuma operação altera ou remove batidas
 * existentes. `criarManual` adiciona um novo registro retroativo; `ajustar`
 * anula a batida original e cria a corrigida (vinculadas) numa só ação;
 * `anular` apenas invalida a batida (sem substituta). Em todos os casos a
 * original permanece visível para o AFD legal.
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

	ajustar: (registroId: string, data: { type: RegistroType; timestamp: string; reason: string }) =>
		post<RegistroRecord>(`/timesheet/registro/${registroId}/ajustar`, data),

	anular: (registroId: string, motivo: string) =>
		post<RegistroRecord>(`/timesheet/registro/${registroId}/anular`, { motivo })
};
