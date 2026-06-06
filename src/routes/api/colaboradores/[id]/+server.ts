import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toColaboradorDTO } from '@/lib/server/colaborador';
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

	let body: Partial<{
		nome: string;
		email: string;
		cpf: string;
		cargo: string;
		departamentoId: string | null;
		dataAdmissao: string;
		status: string;
		telefone: string;
		jornadaId: string | null;
	}>;

	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	const existing = await prisma.colaborador.findUnique({ where: { id: params.id } });
	if (!existing || existing.empresaId !== admin.empresaId) {
		return jsonError('Colaborador não encontrado', 404);
	}

	if (body.departamentoId === null) {
		return jsonError('departamentoId é obrigatório', 400);
	}
	if (body.departamentoId !== undefined) {
		const departamento = await prisma.departamento.findUnique({
			where: { id: body.departamentoId }
		});
		if (!departamento || departamento.empresaId !== admin.empresaId) {
			return jsonError('Departamento inválido', 400);
		}
	}

	const user = await prisma.colaborador.update({
		where: { id: params.id },
		data: {
			name: body.nome ?? undefined,
			email: body.email ?? undefined,
			cpf: body.cpf ?? undefined,
			cargo: body.cargo ?? undefined,
			departamentoId: body.departamentoId ?? undefined,
			telefone: body.telefone ?? undefined,
			dataAdmissao: body.dataAdmissao ? new Date(body.dataAdmissao) : undefined,
			status: body.status ?? undefined,
			jornadaId: body.jornadaId === null ? null : (body.jornadaId ?? undefined)
		},
		include: { departamento: true }
	});

	return jsonOk(toColaboradorDTO(user));
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
