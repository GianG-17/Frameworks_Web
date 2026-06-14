import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { requireUser, jsonError, jsonOk } from '../../_lib/auth-helpers';

/**
 * GET /api/biometria/status
 * Status da biometria do colaborador logado — usado pela tela para mostrar se
 * já existe digital cadastrada e refletir o cadastro feito no leitor.
 */
export const GET: RequestHandler = async ({ request }) => {
	let user;
	try {
		user = requireUser(request);
	} catch (response) {
		return response as Response;
	}

	const colaborador = await prisma.colaborador.findUnique({
		where: { id: user.id },
		select: { biometriaId: true }
	});
	if (!colaborador) return jsonError('Colaborador não encontrado', 404);

	return jsonOk({ biometriaId: colaborador.biometriaId });
};
