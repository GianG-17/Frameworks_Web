import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toFeriasDTO, STATUS_APROVADA } from '@/lib/server/ausencia';
import { requireAdmin, jsonError, jsonOk } from '../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	const lista = await prisma.ausencia.findMany({
		where: { empresaId: admin.empresaId, tipo: 'ferias' },
		orderBy: { dataInicio: 'desc' },
		include: { colaborador: { select: { id: true, usuario: { select: { nome: true } } } } }
	});

	return jsonOk(lista.map(toFeriasDTO));
};

export const POST: RequestHandler = async ({ request }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	let body: Partial<{
		colaboradorId: string;
		dataInicio: string;
		dataFim: string;
		observacao: string;
	}>;
	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	if (!body.colaboradorId || !body.dataInicio || !body.dataFim) {
		return jsonError('colaboradorId, dataInicio e dataFim são obrigatórios', 400);
	}

	const colaborador = await prisma.colaborador.findFirst({
		where: { id: body.colaboradorId, deletedAt: null }
	});
	if (!colaborador || colaborador.empresaId !== admin.empresaId) {
		return jsonError('Colaborador não encontrado', 404);
	}

	// Férias lançadas pelo admin já entram aprovadas (abonam o período no espelho).
	const ferias = await prisma.ausencia.create({
		data: {
			empresaId: admin.empresaId,
			colaboradorId: body.colaboradorId,
			tipo: 'ferias',
			dataInicio: new Date(body.dataInicio),
			dataFim: new Date(body.dataFim),
			motivo: body.observacao ?? null,
			status: STATUS_APROVADA,
			revisadoPor: admin.id,
			revisadoEm: new Date()
		},
		include: { colaborador: { select: { id: true, usuario: { select: { nome: true } } } } }
	});

	return jsonOk(toFeriasDTO(ferias), 201);
};
