/**
 * @endpoint POST /api/auth/forgot-password
 * @description Inicia recuperação de senha. Colaborador se identifica por CPF,
 * admin por e-mail. Envia link de redefinição por e-mail.
 *
 * Resposta sempre genérica (200) para não revelar se a conta existe (anti-enumeração).
 */
import type { RequestHandler } from '@sveltejs/kit';
import {
	encodeResetToken,
	buildResetUrl,
	findAccountByIdentifier
} from '@/lib/server/password-reset';
import { sendPasswordResetEmail } from '@/lib/server/mailer';
import { jsonError, jsonOk } from '../../_lib/auth-helpers';

const RESPOSTA_GENERICA = {
	message: 'Se a conta existir, enviamos um e-mail com instruções para redefinir a senha.'
};

export const POST: RequestHandler = async ({ request }) => {
	let body: { identifier?: string };
	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	const identifier = body.identifier?.trim();
	if (!identifier) {
		return jsonError('identifier é obrigatório', 400);
	}

	const account = await findAccountByIdentifier(identifier);

	if (account) {
		const token = encodeResetToken(account);
		const resetUrl = buildResetUrl(token);
		try {
			await sendPasswordResetEmail(account.email, account.nome, resetUrl);
		} catch (e) {
			// Falha de envio não deve vazar existência da conta; loga e segue com 200.
			console.error('Erro ao enviar e-mail de recuperação:', e);
		}
	}

	return jsonOk(RESPOSTA_GENERICA);
};
