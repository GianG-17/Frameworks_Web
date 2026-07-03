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

	const role = tokenUser.role === 'admin' ? 'admin' : 'colaborador';
	const user =
		role === 'admin'
			? await prisma.usuario.findUnique({ where: { id: tokenUser.id } })
			: await prisma.colaborador.findFirst({ where: { id: tokenUser.id, deletedAt: null } });
	if (!user) return jsonError('Usuário não encontrado', 404);

	return jsonOk(toPayload(user, role));
};
