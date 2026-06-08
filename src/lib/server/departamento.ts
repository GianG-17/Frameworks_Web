/**
 * @module lib/server/departamento
 * @description Mapeamento Departamento (Prisma) → DTO usado pelo frontend.
 */

import type { Departamento as DepartamentoDB } from '@/lib/server/prisma-client/client';

export interface DepartamentoDTO {
	id: string;
	nome: string;
}

export function toDepartamentoDTO(d: DepartamentoDB): DepartamentoDTO {
	return {
		id: d.id,
		nome: d.nome
	};
}
