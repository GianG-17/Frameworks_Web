import type { RequestHandler } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/server/db';
import { encodeToken, toPayload } from '@/lib/server/token';
import { jsonError, jsonOk } from '../../_lib/auth-helpers';

export const POST: RequestHandler = async ({ request }) => {
	let body: { identifier?: string; password?: string };

	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	const { identifier, password } = body;

	if (!identifier || !password) {
		return jsonError('identifier e password são obrigatórios', 400);
	}

	const isEmail = identifier.includes('@');

	// CPF é armazenado canonizado (só dígitos) e e-mail em minúsculas.
	const where = isEmail
		? { email: identifier.trim().toLowerCase() }
		: { cpf: identifier.replace(/\D/g, '') };

	// Busca em ambas as tabelas: admin (Usuario) tem precedência sobre Colaborador.
	const admin = await prisma.usuario.findFirst({ where });
	const colaborador = admin
		? null
		: await prisma.colaborador.findFirst({ where: { ...where, deletedAt: null } });

	const account = admin ?? colaborador;
	if (!account) return jsonError('Credenciais inválidas', 401);

	const ok = await bcrypt.compare(password, account.password);
	if (!ok) return jsonError('Credenciais inválidas', 401);

	const payload = toPayload(account, admin ? 'admin' : 'colaborador');
	const token = encodeToken(payload);

	return jsonOk({ token, user: payload });
};
