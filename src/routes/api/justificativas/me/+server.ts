import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { requireUser, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
	let user;
	try {
		user = requireUser(request);
	} catch (response) {
		return response as Response;
	}

	const lista = await prisma.justificativa.findMany({
		where: {
			empresaId: user.empresaId,
			colaboradorId: user.id
		},
		orderBy: { data: 'desc' }
	});

	return jsonOk(
		lista.map((j) => ({
			id: j.id,
			colaboradorId: j.colaboradorId,
			colaboradorNome: user.name,
			data: j.data.toISOString(),
			motivo: j.motivo,
			anexoUrl: j.anexoUrl,
			status: j.status,
			approvedBy: j.approvedBy,
			approvedAt: j.approvedAt?.toISOString()
		}))
	);
};

export const POST: RequestHandler = async ({ request }) => {
	let user;
	try {
		user = requireUser(request);
	} catch (response) {
		return response as Response;
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

	const justificativa = await prisma.justificativa.create({
		data: {
			empresaId: user.empresaId,
			colaboradorId: user.id,
			data: new Date(body.data),
			motivo: body.motivo,
			anexoUrl: body.anexoUrl ?? null
		}
	});

	return jsonOk(justificativa, 201);
};
