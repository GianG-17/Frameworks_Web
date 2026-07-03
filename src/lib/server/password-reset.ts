/**
 * @module lib/server/password-reset
 * @description Token de redefinição de senha (JWT stateless) e busca de contas.
 *
 * O token é assinado com `JWT_SECRET + hash-da-senha-atual`. Assim que a senha
 * é trocada, o hash muda e o segredo derivado deixa de validar tokens antigos —
 * garantindo uso único sem tabela auxiliar.
 */

import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/server/db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-trocar-em-producao';
const RESET_EXPIRES_IN = '1h';
const PURPOSE = 'pwd-reset';

export type Role = 'admin' | 'colaborador';

export interface Account {
	id: string;
	name: string;
	email: string;
	role: Role;
	password: string;
}

/** Segredo derivado: some quando a senha (e portanto seu hash) muda → uso único. */
function resetSecret(passwordHash: string): string {
	return JWT_SECRET + passwordHash;
}

export function encodeResetToken(
	account: Pick<Account, 'id' | 'role' | 'password'>,
	expiresIn: string = RESET_EXPIRES_IN
): string {
	return jwt.sign({ purpose: PURPOSE, role: account.role }, resetSecret(account.password), {
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
export function verifyResetToken(token: string, passwordHash: string): boolean {
	try {
		const decoded = jwt.verify(token, resetSecret(passwordHash)) as { purpose?: string };
		return decoded.purpose === PURPOSE;
	} catch {
		return false;
	}
}

/**
 * Busca a conta pelo identificador de login: e-mail → admin (Usuario);
 * caso contrário CPF → colaborador (só ativos, `deletedAt: null`).
 */
export async function findAccountByIdentifier(identifier: string): Promise<Account | null> {
	const isEmail = identifier.includes('@');

	if (isEmail) {
		const admin = await prisma.usuario.findFirst({
			where: { email: identifier.trim().toLowerCase() }
		});
		return admin ? { ...admin, role: 'admin' } : null;
	}

	const cpf = identifier.replace(/\D/g, '');
	const colaborador = await prisma.colaborador.findFirst({ where: { cpf, deletedAt: null } });
	return colaborador ? { ...colaborador, role: 'colaborador' } : null;
}

/** Busca a conta por id + papel (usado ao redefinir a senha a partir do token). */
export async function findAccountByIdAndRole(id: string, role: Role): Promise<Account | null> {
	if (role === 'admin') {
		const admin = await prisma.usuario.findUnique({ where: { id } });
		return admin ? { ...admin, role: 'admin' } : null;
	}
	const colaborador = await prisma.colaborador.findFirst({ where: { id, deletedAt: null } });
	return colaborador ? { ...colaborador, role: 'colaborador' } : null;
}
