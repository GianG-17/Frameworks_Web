/**
 * @module lib/server/jornada
 * @description Serialização de Jornada (dias armazenados como JSON string no SQLite).
 */

import type { Jornada as JornadaDB } from '@prisma/client';

export interface DiaSemanaDTO {
  ativo: boolean;
  entrada: string;
  saida_almoco: string;
  retorno_almoco: string;
  saida: string;
}

export type DiaSemanaKey =
  | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';

export interface JornadaDTO {
  id: string;
  nome: string;
  dias: Record<DiaSemanaKey, DiaSemanaDTO>;
}

export function toJornadaDTO(j: JornadaDB): JornadaDTO {
  return {
    id: j.id,
    nome: j.nome,
    dias: JSON.parse(j.dias) as Record<DiaSemanaKey, DiaSemanaDTO>
  };
}
