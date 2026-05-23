/**
 * @module lib/server/colaborador
 * @description Mapeamento User (Prisma) → Colaborador (DTO) usado pelo frontend.
 */

import type { Departamento, User } from '@prisma/client';

export interface ColaboradorDTO {
	id: string;
	nome: string;
	email: string;
	cpf: string;
	cargo: string;
	departamentoId: string | null;
	departamento: { id: string; nome: string } | null;
	dataAdmissao: string;
	status: string;
	telefone?: string;
	jornadaId?: string;
}

type UserComDepartamento = User & { departamento?: Departamento | null };

export function toColaboradorDTO(user: UserComDepartamento): ColaboradorDTO {
	return {
		id: user.id,
		nome: user.name,
		email: user.email,
		cpf: user.cpf,
		cargo: user.cargo ?? '',
		departamentoId: user.departamentoId ?? null,
		departamento: user.departamento
			? { id: user.departamento.id, nome: user.departamento.nome }
			: null,
		dataAdmissao: user.dataAdmissao ? user.dataAdmissao.toISOString().split('T')[0] : '',
		status: user.status ?? 'ativo',
		telefone: user.telefone ?? undefined,
		jornadaId: user.jornadaId ?? undefined
	};
}
