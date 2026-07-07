import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import {
	toJustificativaDTO,
	TIPO_JUSTIFICATIVA_PADRAO,
	STATUS_APROVADA
} from '@/lib/server/ausencia';
import { requireAdmin, jsonError, jsonOk } from '../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	const lista = await prisma.ausencia.findMany({
		where: { empresaId: admin.empresaId, tipo: { not: 'ferias' } },
		orderBy: { dataInicio: 'desc' },
		include: { colaborador: { select: { usuario: { select: { nome: true } } } } }
	});

	return jsonOk(lista.map((j) => toJustificativaDTO(j, j.colaborador.usuario.nome)));
};

export const POST: RequestHandler = async ({ request }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	let body: Partial<{ colaboradorId: string; data: string; motivo: string; anexoUrl: string }>;
	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	if (!body.colaboradorId || !body.data || !body.motivo) {
		return jsonError('colaboradorId, data e motivo são obrigatórios', 400);
	}

	const colaborador = await prisma.colaborador.findFirst({
		where: { id: body.colaboradorId, deletedAt: null },
		include: { usuario: { select: { nome: true } } }
	});
	if (!colaborador || colaborador.empresaId !== admin.empresaId) {
		return jsonError('Colaborador não encontrado', 404);
	}

	const dia = new Date(body.data);
	const justificativa = await prisma.ausencia.create({
		data: {
			empresaId: admin.empresaId,
			colaboradorId: body.colaboradorId,
			tipo: TIPO_JUSTIFICATIVA_PADRAO,
			dataInicio: dia,
			dataFim: dia,
			motivo: body.motivo,
			anexoUrl: body.anexoUrl ?? null,
			status: STATUS_APROVADA,
			revisadoPor: admin.id,
			revisadoEm: new Date()
		}
	});

	return jsonOk(toJustificativaDTO(justificativa, colaborador.usuario.nome), 201);
};
