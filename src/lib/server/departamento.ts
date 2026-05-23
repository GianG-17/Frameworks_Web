/**
 * @module lib/server/departamento
 * @description Mapeamento Departamento (Prisma) → DTO usado pelo frontend.
 */

import type { Departamento as DepartamentoDB } from '@prisma/client';

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
