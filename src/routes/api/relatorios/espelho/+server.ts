import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { buildDailySummaries, dateKey } from '@/lib/server/timesheet';
import { requireAdmin, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request, url }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	const colaboradorId = url.searchParams.get('colaboradorId');
	const inicio = url.searchParams.get('inicio');
	const fim = url.searchParams.get('fim');

	if (!colaboradorId || !inicio || !fim) {
		return jsonError('colaboradorId, inicio e fim são obrigatórios', 400);
	}

	const colaborador = await prisma.colaborador.findUnique({ where: { id: colaboradorId } });
	if (!colaborador || colaborador.empresaId !== admin.empresaId) {
		return jsonError('Colaborador não encontrado', 404);
	}

	const start = new Date(`${inicio}T00:00:00.000Z`);
	const end = new Date(`${fim}T23:59:59.999Z`);
	if (isNaN(start.getTime()) || isNaN(end.getTime())) {
		return jsonError('Datas inválidas', 400);
	}

	const [punches, justificativas] = await Promise.all([
		prisma.punch.findMany({
			where: { colaboradorId, timestamp: { gte: start, lte: end } },
			orderBy: { timestamp: 'asc' },
			include: { anulacao: true }
		}),
		prisma.justificativa.findMany({
			where: {
				colaboradorId,
				empresaId: admin.empresaId,
				status: 'approved',
				data: { gte: start, lte: end }
			}
		})
	]);

	const datasAbonadas = new Set(justificativas.map((j) => dateKey(j.data)));
	const dias = buildDailySummaries(punches, datasAbonadas);
	const totalHoras = dias.reduce((acc, d) => acc + d.totalHours, 0);
	const totalExtras = dias.reduce((acc, d) => acc + d.overtime, 0);
	const totalDeficit = dias.reduce((acc, d) => acc + d.deficit, 0);

	return jsonOk({
		colaborador: { id: colaborador.id, nome: colaborador.name },
		inicio,
		fim,
		dias,
		totais: {
			horas: Number(totalHoras.toFixed(2)),
			extras: Number(totalExtras.toFixed(2)),
			deficit: Number(totalDeficit.toFixed(2))
		}
	});
};
