/**
 * @module lib/server/colaborador
 * @description Mapeamento User (Prisma) → Colaborador (DTO) usado pelo frontend.
 */

import type { User } from '@prisma/client';

export interface ColaboradorDTO {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  cargo: string;
  departamento: string;
  dataAdmissao: string;
  status: string;
  telefone?: string;
  jornadaId?: string;
}

export function toColaboradorDTO(user: User): ColaboradorDTO {
  return {
    id: user.id,
    nome: user.name,
    email: user.email,
    cpf: user.cpf,
    cargo: user.cargo ?? '',
    departamento: user.departamento ?? '',
    dataAdmissao: user.dataAdmissao ? user.dataAdmissao.toISOString().split('T')[0] : '',
    status: user.status ?? 'ativo',
    telefone: user.telefone ?? undefined,
    jornadaId: user.jornadaId ?? undefined
  };
}
