import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toColaboradorDTO, emailEmUso, cpfEmUso, mapPrismaError } from '@/lib/server/colaborador';
import { colaboradorUpdateSchema } from '@/lib/schemas/colaborador.schema';
import { requireAdmin, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request, params }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	const user = await prisma.colaborador.findUnique({
		where: { id: params.id },
		include: { departamento: true }
	});
	if (!user || user.empresaId !== admin.empresaId) {
		return jsonError('Colaborador não encontrado', 404);
	}

	return jsonOk(toColaboradorDTO(user));
};

export const PUT: RequestHandler = async ({ request, params }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	const parsed = colaboradorUpdateSchema.safeParse(body);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		return jsonError(issue.message, 400, String(issue.path[0] ?? ''));
	}
	const data = parsed.data;

	const existing = await prisma.colaborador.findUnique({ where: { id: params.id } });
	if (!existing || existing.empresaId !== admin.empresaId) {
		return jsonError('Colaborador não encontrado', 404);
	}

	if (data.departamentoId !== undefined) {
		const departamento = await prisma.departamento.findUnique({
			where: { id: data.departamentoId }
		});
		if (!departamento || departamento.empresaId !== admin.empresaId) {
			return jsonError('Departamento inválido', 400, 'departamentoId');
		}
	}

	if (data.jornadaId) {
		const jornada = await prisma.jornada.findUnique({ where: { id: data.jornadaId } });
		if (!jornada || jornada.empresaId !== admin.empresaId) {
			return jsonError('Jornada inválida', 400, 'jornadaId');
		}
	}

	if (data.email !== undefined && (await emailEmUso(data.email, params.id))) {
		return jsonError('E-mail já cadastrado', 409, 'email');
	}
	if (data.cpf !== undefined && (await cpfEmUso(data.cpf, params.id))) {
		return jsonError('CPF já cadastrado', 409, 'cpf');
	}

	try {
		const user = await prisma.colaborador.update({
			where: { id: params.id },
			data: {
				name: data.nome,
				email: data.email,
				cpf: data.cpf,
				cargo: data.cargo,
				departamentoId: data.departamentoId,
				telefone: data.telefone === undefined ? undefined : data.telefone || null,
				dataAdmissao: data.dataAdmissao === undefined ? undefined : new Date(data.dataAdmissao),
				status: data.status,
				jornadaId: data.jornadaId
			},
			include: { departamento: true }
		});

		return jsonOk(toColaboradorDTO(user));
	} catch (e) {
		return mapPrismaError(e);
	}
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	const existing = await prisma.colaborador.findUnique({ where: { id: params.id } });
	if (!existing || existing.empresaId !== admin.empresaId) {
		return jsonError('Colaborador não encontrado', 404);
	}

	await prisma.colaborador.delete({ where: { id: params.id } });
	return new Response(null, { status: 204 });
};
