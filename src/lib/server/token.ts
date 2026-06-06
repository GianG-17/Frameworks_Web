/**
 * @module lib/server/token
 * @description Codifica/decodifica tokens de autenticação.
 * Formato atual: Base64(JSON do usuário). Simples para dev; trocar por JWT/sessão opaca em produção.
 */

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
