import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toJornadaDTO, dataAmanhaUTC, parseDataUTC } from '@/lib/server/jornada';
import { requireAdmin, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const PUT: RequestHandler = async ({ request, params }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	let body: { nome?: string; dias?: unknown; vigenciaInicio?: string };
	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	const existing = await prisma.jornada.findUnique({
		where: { id: params.id }
	});
	if (!existing || existing.empresaId !== admin.empresaId) {
		return jsonError('Jornada não encontrada', 404);
	}

	if (body.nome) {
		await prisma.jornada.update({ where: { id: params.id }, data: { nome: body.nome } });
	}

	// Alteração de horário: a pessoa escolhe a data de vigência (default amanhã).
	// Versões passadas permanecem como histórico; o upsert por (jornadaId,
	// vigenciaInicio) sobrescreve a versão daquela data — inclusive "hoje", quando
	// é uma correção. A proteção do passado é a resolução por versão em `versaoVigenteEm`.
	if (body.dias) {
		const dias = body.dias as object;
		const vigenciaInicio = body.vigenciaInicio
			? parseDataUTC(body.vigenciaInicio)
			: dataAmanhaUTC();
		if (!vigenciaInicio) {
			return jsonError('Data de vigência inválida', 400);
		}
		await prisma.jornadaVersao.upsert({
			where: { jornadaId_vigenciaInicio: { jornadaId: params.id, vigenciaInicio } },
			update: { dias },
			create: { jornadaId: params.id, dias, vigenciaInicio }
		});
	}

	const jornada = await prisma.jornada.findUnique({
		where: { id: params.id },
		include: { versoes: { orderBy: { vigenciaInicio: 'asc' } } }
	});

	return jsonOk(toJornadaDTO(jornada!));
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	const existing = await prisma.jornada.findUnique({ where: { id: params.id } });
	if (!existing || existing.empresaId !== admin.empresaId) {
		return jsonError('Jornada não encontrada', 404);
	}

	await prisma.jornada.delete({ where: { id: params.id } });
	return new Response(null, { status: 204 });
};
