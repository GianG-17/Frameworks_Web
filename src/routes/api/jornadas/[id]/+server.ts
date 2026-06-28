import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toJornadaDTO, dataHojeUTC, dataAmanhaUTC } from '@/lib/server/jornada';
import { requireAdmin, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const PUT: RequestHandler = async ({ request, params }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	let body: { nome?: string; dias?: unknown };
	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	const existing = await prisma.jornada.findUnique({
		where: { id: params.id },
		include: { versoes: { orderBy: { vigenciaInicio: 'desc' }, take: 1 } }
	});
	if (!existing || existing.empresaId !== admin.empresaId) {
		return jsonError('Jornada não encontrada', 404);
	}

	if (body.nome) {
		await prisma.jornada.update({ where: { id: params.id }, data: { nome: body.nome } });
	}

	// Alteração de horário: versões já vigentes são imutáveis (histórico). A nova
	// versão vale a partir de amanhã. Exceção segura: corrigir uma jornada
	// recém-criada (versão vigente começou hoje) que ainda não tem batidas.
	if (body.dias) {
		const dias = body.dias as object;
		const latest = existing.versoes[0];
		const hoje = dataHojeUTC();

		const versaoDeHoje = latest && latest.vigenciaInicio.getTime() === hoje.getTime();
		const semUso =
			versaoDeHoje &&
			(await prisma.registro.count({
				where: { empresaId: admin.empresaId, colaborador: { jornadaId: params.id } }
			})) === 0;

		if (latest && semUso) {
			await prisma.jornadaVersao.update({ where: { id: latest.id }, data: { dias } });
		} else {
			const vigenciaInicio = dataAmanhaUTC();
			await prisma.jornadaVersao.upsert({
				where: { jornadaId_vigenciaInicio: { jornadaId: params.id, vigenciaInicio } },
				update: { dias },
				create: { jornadaId: params.id, dias, vigenciaInicio }
			});
		}
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
