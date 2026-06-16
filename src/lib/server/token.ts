/**
 * @module lib/server/token
 * @description Codifica/decodifica tokens de autenticação.
 * Formato: JWT assinado (HS256) com expiração. O segredo vem de `JWT_SECRET`.
 */

import jwt from 'jsonwebtoken';

// Segredo de assinatura. Em produção, defina `JWT_SECRET` no ambiente — o fallback
// abaixo serve apenas para desenvolvimento local e NÃO deve ser usado em produção.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-trocar-em-producao';
// Validade do token. Cobre uma jornada de trabalho com folga.
const JWT_EXPIRES_IN = '12h';

export interface TokenPayload {
	id: string;
	name: string;
	email: string;
	cpf: string;
	role: string;
	empresaId: string;
}

// Entidade autenticável: Usuario (admin) ou Colaborador. O `role` não vive mais
// na tabela — é derivado de qual modelo originou o login e injetado aqui.
type Autenticavel = {
	id: string;
	name: string;
	email: string;
	cpf: string;
	empresaId: string;
};

export function toPayload(user: Autenticavel, role: 'admin' | 'colaborador'): TokenPayload {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		cpf: user.cpf,
		role,
		empresaId: user.empresaId
	};
}

export function encodeToken(payload: TokenPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function decodeToken(token: string): TokenPayload | null {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & jwt.JwtPayload;
		// Descarta os claims do JWT (iat/exp) e devolve só o payload da aplicação.
		return {
			id: decoded.id,
			name: decoded.name,
			email: decoded.email,
			cpf: decoded.cpf,
			role: decoded.role,
			empresaId: decoded.empresaId
		};
	} catch {
		// Assinatura inválida, token expirado ou malformado.
		return null;
	}
}
