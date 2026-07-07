/**
 * @endpoint POST /api/auth/reset-password
 * @description Conclui a recuperação de senha: valida o token e grava a nova senha.
 *
 * O token é validado contra o hash de senha atual da conta (uso único: trocar a
 * senha invalida o token). Vale tanto para admin (Usuario) quanto colaborador.
 */
import type { RequestHandler } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/server/db';
import { isStrongPassword } from '@/utils/validators';
import { peekResetToken, verifyResetToken, findAccountById } from '@/lib/server/password-reset';
import { jsonError, jsonOk } from '../../_lib/auth-helpers';

export const POST: RequestHandler = async ({ request }) => {
	let body: { token?: string; password?: string };
	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	const { token, password } = body;
	if (!token || !password) {
		return jsonError('token e password são obrigatórios', 400);
	}

	if (!isStrongPassword(password)) {
		return jsonError(
			'A senha deve ter ao menos 8 caracteres, uma letra maiúscula e um número',
			400,
			'password'
		);
	}

	const peek = peekResetToken(token);
	if (!peek) return jsonError('Token inválido ou expirado', 400);

	const account = await findAccountById(peek.id);
	if (!account || !verifyResetToken(token, account.senhaHash)) {
		return jsonError('Token inválido ou expirado', 400);
	}

	// Login mora só em `usuarios`: a senha sempre é gravada na identidade.
	const hashed = await bcrypt.hash(password, 10);
	await prisma.usuario.update({ where: { id: account.id }, data: { senhaHash: hashed } });

	return jsonOk({ message: 'Senha redefinida com sucesso.' });
};
