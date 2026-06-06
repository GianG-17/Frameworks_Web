import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { requireAdmin, jsonError, jsonOk } from '../../../_lib/auth-helpers';

export const POST: RequestHandler = async ({ request, params }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	const existing = await prisma.justificativa.findUnique({ where: { id: params.id } });
	if (!existing || existing.empresaId !== admin.empresaId) {
		return jsonError('Justificativa não encontrada', 404);
	}

	const updated = await prisma.justificativa.update({
		where: { id: params.id },
		data: {
			status: 'rejected',
			approvedBy: admin.id,
			approvedAt: new Date()
		}
	});

	return jsonOk({
		id: updated.id,
		status: updated.status,
		approvedAt: updated.approvedAt?.toISOString(),
		approvedBy: updated.approvedBy
	});
};
