import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { requireAdmin, jsonError, jsonOk } from '../../../_lib/auth-helpers';

/**
 * PATCH /api/departamentos/[id]/jornada
 * Body: { jornadaId: string | null }
 * Aplica a jornada (ou desvincula) para todos os colaboradores do departamento.
 */
export const PATCH: RequestHandler = async ({ request, params }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	let body: { jornadaId?: string | null };
	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	if (body.jornadaId === undefined) {
		return jsonError('jornadaId é obrigatório (use null para desvincular)', 400);
	}

	const departamento = await prisma.departamento.findUnique({ where: { id: params.id } });
	if (!departamento || departamento.empresaId !== admin.empresaId) {
		return jsonError('Departamento não encontrado', 404);
	}

	if (body.jornadaId) {
		const jornada = await prisma.jornada.findUnique({ where: { id: body.jornadaId } });
		if (!jornada || jornada.empresaId !== admin.empresaId) {
			return jsonError('Jornada não encontrada', 404);
		}
	}

	const resultado = await prisma.colaborador.updateMany({
		where: {
			empresaId: admin.empresaId,
			departamentoId: params.id,
			deletedAt: null
		},
		data: { jornadaId: body.jornadaId }
	});

	return jsonOk({ atualizados: resultado.count });
};
