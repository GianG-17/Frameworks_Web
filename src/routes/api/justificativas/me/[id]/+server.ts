import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { requireUser, jsonError } from '../../../_lib/auth-helpers';

export const DELETE: RequestHandler = async ({ request, params }) => {
	let user;
	try {
		user = requireUser(request);
	} catch (response) {
		return response as Response;
	}

	const existing = await prisma.ausencia.findUnique({ where: { id: params.id } });
	if (!existing || existing.tipo === 'ferias') {
		return jsonError('Justificativa não encontrada', 404);
	}

	// Verifica se a justificativa pertence a este colaborador e à mesma empresa
	if (existing.colaboradorId !== user.colaboradorId || existing.empresaId !== user.empresaId) {
		return jsonError('Você não tem permissão para remover esta justificativa', 403);
	}

	await prisma.ausencia.delete({ where: { id: params.id } });
	return new Response(null, { status: 204 });
};
