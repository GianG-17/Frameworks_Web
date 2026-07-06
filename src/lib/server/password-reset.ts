/**
 * @module lib/server/password-reset
 * @description Token de redefinição de senha (JWT stateless) e busca de contas.
 *
 * O token é assinado com `JWT_SECRET + hash-da-senha-atual`. Assim que a senha
 * é trocada, o hash muda e o segredo derivado deixa de validar tokens antigos —
 * garantindo uso único sem tabela auxiliar.
 *
 * Login mora só em `usuarios` (identidade). Um colaborador desligado (extensão
 * `Colaborador` com `deletedAt`) não pode redefinir senha.
 */

import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/server/db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-trocar-em-producao';
const RESET_EXPIRES_IN = '1h';
const PURPOSE = 'pwd-reset';

export type Role = 'admin' | 'colaborador';

export interface Account {
	id: string; // Usuario.id
	nome: string;
	email: string;
	role: Role;
	senhaHash: string;
}

/** Segredo derivado: some quando a senha (e portanto seu hash) muda → uso único. */
function resetSecret(senhaHash: string): string {
	return JWT_SECRET + senhaHash;
}

export function encodeResetToken(
	account: Pick<Account, 'id' | 'role' | 'senhaHash'>,
	expiresIn: string = RESET_EXPIRES_IN
): string {
	return jwt.sign({ purpose: PURPOSE, role: account.role }, resetSecret(account.senhaHash), {
		subject: account.id,
		expiresIn: expiresIn as jwt.SignOptions['expiresIn']
	});
}

/**
 * Monta a URL pública de redefinição/criação de senha a partir de um token.
 * Lê o ambiente em call-time (não no load) para não capturar `undefined`.
 */
export function buildResetUrl(token: string): string {
	const appUrl = process.env.APP_URL || process.env.ORIGIN || 'http://localhost:3050';
	return `${appUrl}/auth/redefinir-senha?token=${encodeURIComponent(token)}`;
}

/**
 * Lê `sub` (id) e `role` do token SEM verificar assinatura — usado só para
 * localizar a conta cujo hash de senha valida o token de fato.
 */
export function peekResetToken(token: string): { id: string; role: Role } | null {
	const decoded = jwt.decode(token) as { sub?: string; role?: string; purpose?: string } | null;
	if (!decoded || decoded.purpose !== PURPOSE || !decoded.sub) return null;
	if (decoded.role !== 'admin' && decoded.role !== 'colaborador') return null;
	return { id: decoded.sub, role: decoded.role };
}

/** Verifica o token contra o hash de senha atual da conta. */
export function verifyResetToken(token: string, senhaHash: string): boolean {
	try {
		const decoded = jwt.verify(token, resetSecret(senhaHash)) as { purpose?: string };
		return decoded.purpose === PURPOSE;
	} catch {
		return false;
	}
}

/** Monta o Account a partir de uma identidade; bloqueia colaborador desligado. */
function toAccount(usuario: {
	id: string;
	nome: string;
	email: string;
	role: string;
	senhaHash: string;
	colaborador: { deletedAt: Date | null } | null;
}): Account | null {
	if (usuario.colaborador?.deletedAt) return null;
	return {
		id: usuario.id,
		nome: usuario.nome,
		email: usuario.email,
		role: usuario.role === 'admin' ? 'admin' : 'colaborador',
		senhaHash: usuario.senhaHash
	};
}

/**
 * Busca a conta pelo identificador de login: e-mail ou CPF (só dígitos).
 * Com unicidade por empresa, o identificador pode colidir entre empresas — no MVP
 * de empresa única usamos o primeiro match (ver limitação em login/+server.ts).
 */
export async function findAccountByIdentifier(identifier: string): Promise<Account | null> {
	const isEmail = identifier.includes('@');
	const where = isEmail
		? { email: identifier.trim().toLowerCase() }
		: { cpf: identifier.replace(/\D/g, '') };

	const usuario = await prisma.usuario.findFirst({
		where,
		include: { colaborador: { select: { deletedAt: true } } }
	});
	return usuario ? toAccount(usuario) : null;
}

/** Busca a conta por id (usado ao redefinir a senha a partir do token). */
export async function findAccountById(id: string): Promise<Account | null> {
	const usuario = await prisma.usuario.findUnique({
		where: { id },
		include: { colaborador: { select: { deletedAt: true } } }
	});
	return usuario ? toAccount(usuario) : null;
}
