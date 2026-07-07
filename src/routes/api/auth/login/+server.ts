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

	// Login mora só em `usuarios` (identidade). O papel vem de `role`; o vínculo de
	// colaborador (bater ponto) vem da existência da extensão `Colaborador`.
	// NOTA: com unicidade por empresa, email/cpf podem colidir entre empresas — no
	// MVP de empresa única, findFirst basta; multi-empresa exigirá discriminador
	// de tenant no login (ex.: código/subdomínio da empresa).
	const usuario = await prisma.usuario.findFirst({
		where,
		include: { colaborador: { select: { id: true, deletedAt: true } } }
	});

	if (!usuario) return jsonError('Credenciais inválidas', 401);

	// Colaborador desligado (soft delete) não autentica.
	if (usuario.colaborador?.deletedAt) return jsonError('Credenciais inválidas', 401);

	const ok = await bcrypt.compare(password, usuario.senhaHash);
	if (!ok) return jsonError('Credenciais inválidas', 401);

	const payload = toPayload(usuario, usuario.colaborador?.id ?? null);
	const token = encodeToken(payload);

	return jsonOk({ token, user: payload });
};
