/**
 * @module lib/server/token
 * @description Codifica/decodifica tokens de autenticação.
 * Formato atual: Base64(JSON do usuário). Simples para dev; trocar por JWT/sessão opaca em produção.
 */

import type { User } from '@prisma/client';

export interface TokenPayload {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: string;
  empresaId: string;
}

export function toPayload(
  user: Pick<User, 'id' | 'name' | 'email' | 'cpf' | 'role' | 'empresaId'>
): TokenPayload {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf,
    role: user.role,
    empresaId: user.empresaId
  };
}

export function encodeToken(payload: TokenPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64');
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const json = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}
