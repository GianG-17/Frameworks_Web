import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { buildSummary, dateKey } from '@/lib/server/timesheet';
import { requireUser, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
	let user;
	try {
		user = requireUser(request);
	} catch (response) {
		return response as Response;
	}

	const now = new Date();
	if (!user.colaboradorId) {
		// Usuário sem vínculo de colaborador (admin puro) não tem ponto.
		return jsonOk(buildSummary(dateKey(now), [], false));
	}
	const colaboradorId = user.colaboradorId;

	const start = new Date(now);
	start.setUTCHours(0, 0, 0, 0);
	const end = new Date(now);
	end.setUTCHours(23, 59, 59, 999);

	const [registros, ausencias] = await Promise.all([
		prisma.registro.findMany({
			where: { colaboradorId, marcadoEm: { gte: start, lte: end } },
			orderBy: { marcadoEm: 'asc' },
			include: { anulacao: true }
		}),
		// Ausência aprovada que cobre o dia (dataInicio ≤ fim do dia e dataFim ≥ início).
		prisma.ausencia.findMany({
			where: {
				colaboradorId,
				status: 'aprovada',
				dataInicio: { lte: end },
				dataFim: { gte: start }
			}
		})
	]);

	const abonado = ausencias.length > 0;
	return jsonOk(buildSummary(dateKey(now), registros, abonado));
};
