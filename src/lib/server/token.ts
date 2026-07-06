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
	id: string; // Usuario.id (identidade autenticável)
	nome: string;
	email: string;
	cpf: string;
	role: string; // "admin" | "colaborador" — acesso de gestão
	empresaId: string;
	// Presente quando a identidade tem extensão Colaborador (bate ponto). Habilita
	// o registro de ponto inclusive para um admin que também é colaborador (RH).
	colaboradorId: string | null;
}

// Identidade autenticável (Usuario). `role` e o vínculo de colaborador vivem no
// banco: `role` na própria identidade e `colaboradorId` na extensão Colaborador.
type Identidade = {
	id: string;
	nome: string;
	email: string;
	cpf: string;
	empresaId: string;
	role: string;
};

export function toPayload(usuario: Identidade, colaboradorId?: string | null): TokenPayload {
	return {
		id: usuario.id,
		nome: usuario.nome,
		email: usuario.email,
		cpf: usuario.cpf,
		role: usuario.role,
		empresaId: usuario.empresaId,
		colaboradorId: colaboradorId ?? null
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
			nome: decoded.nome,
			email: decoded.email,
			cpf: decoded.cpf,
			role: decoded.role,
			empresaId: decoded.empresaId,
			colaboradorId: decoded.colaboradorId ?? null
		};
	} catch {
		// Assinatura inválida, token expirado ou malformado.
		return null;
	}
}
