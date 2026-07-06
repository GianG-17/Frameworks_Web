import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toPayload } from '@/lib/server/token';
import { requireUser, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
	let tokenUser;
	try {
		tokenUser = requireUser(request);
	} catch (response) {
		return response as Response;
	}

	const usuario = await prisma.usuario.findUnique({
		where: { id: tokenUser.id },
		include: { colaborador: { select: { id: true, deletedAt: true } } }
	});
	if (!usuario || usuario.colaborador?.deletedAt) {
		return jsonError('Usuário não encontrado', 404);
	}

	return jsonOk(toPayload(usuario, usuario.colaborador?.id ?? null));
};
