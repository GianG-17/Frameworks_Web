import type { RequestHandler } from '@sveltejs/kit';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/server/db';
import { toDepartamentoDTO } from '@/lib/server/departamento';
import { requireAdmin, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const PUT: RequestHandler = async ({ request, params }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	let body: { nome?: string };
	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	const nome = body.nome?.trim();
	if (!nome) {
		return jsonError('nome é obrigatório', 400);
	}

	const existing = await prisma.departamento.findUnique({ where: { id: params.id } });
	if (!existing || existing.empresaId !== admin.empresaId) {
		return jsonError('Departamento não encontrado', 404);
	}

	try {
		const dep = await prisma.departamento.update({
			where: { id: params.id },
			data: { nome }
		});
		return jsonOk(toDepartamentoDTO(dep));
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
			return jsonError('Já existe um departamento com esse nome', 409);
		}
		throw e;
	}
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	const existing = await prisma.departamento.findUnique({ where: { id: params.id } });
	if (!existing || existing.empresaId !== admin.empresaId) {
		return jsonError('Departamento não encontrado', 404);
	}

	await prisma.departamento.delete({ where: { id: params.id } });
	return new Response(null, { status: 204 });
};
