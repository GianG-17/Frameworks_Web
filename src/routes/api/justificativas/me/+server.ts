import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toJustificativaDTO, TIPO_JUSTIFICATIVA_PADRAO } from '@/lib/server/ausencia';
import { requireUser, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
	let user;
	try {
		user = requireUser(request);
	} catch (response) {
		return response as Response;
	}

	if (!user.colaboradorId) return jsonOk([]);

	const lista = await prisma.ausencia.findMany({
		where: {
			empresaId: user.empresaId,
			colaboradorId: user.colaboradorId,
			tipo: { not: 'ferias' }
		},
		orderBy: { dataInicio: 'desc' }
	});

	return jsonOk(lista.map((j) => toJustificativaDTO(j, user.nome)));
};

export const POST: RequestHandler = async ({ request }) => {
	let user;
	try {
		user = requireUser(request);
	} catch (response) {
		return response as Response;
	}

	if (!user.colaboradorId) {
		return jsonError('Usuário sem vínculo de colaborador', 403);
	}

	let body: Partial<{ data: string; motivo: string; anexoUrl: string }>;
	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	if (!body.data || !body.motivo) {
		return jsonError('data e motivo são obrigatórios', 400);
	}

	// Justificativa aberta pelo colaborador nasce pendente (status default no schema).
	const dia = new Date(body.data);
	const justificativa = await prisma.ausencia.create({
		data: {
			empresaId: user.empresaId,
			colaboradorId: user.colaboradorId,
			tipo: TIPO_JUSTIFICATIVA_PADRAO,
			dataInicio: dia,
			dataFim: dia,
			motivo: body.motivo,
			anexoUrl: body.anexoUrl ?? null
		}
	});

	return jsonOk(toJustificativaDTO(justificativa, user.nome), 201);
};
