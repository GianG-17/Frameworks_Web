import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { statusToDto, STATUS_REJEITADA } from '@/lib/server/ausencia';
import { requireAdmin, jsonError, jsonOk } from '../../../_lib/auth-helpers';

export const POST: RequestHandler = async ({ request, params }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	const existing = await prisma.ausencia.findUnique({ where: { id: params.id } });
	if (!existing || existing.empresaId !== admin.empresaId || existing.tipo === 'ferias') {
		return jsonError('Justificativa não encontrada', 404);
	}

	const updated = await prisma.ausencia.update({
		where: { id: params.id },
		data: {
			status: STATUS_REJEITADA,
			revisadoPor: admin.id,
			revisadoEm: new Date()
		}
	});

	return jsonOk({
		id: updated.id,
		status: statusToDto(updated.status),
		approvedAt: updated.revisadoEm?.toISOString(),
		approvedBy: updated.revisadoPor
	});
};
