import type { RequestHandler } from '@sveltejs/kit';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/server/db';
import { toDepartamentoDTO } from '@/lib/server/departamento';
import { requireAdmin, requireUser, jsonError, jsonOk } from '../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
	let user;
	try {
		user = requireUser(request);
	} catch (response) {
		return response as Response;
	}

	const departamentos = await prisma.departamento.findMany({
		where: { empresaId: user.empresaId },
		orderBy: { nome: 'asc' }
	});
	return jsonOk(departamentos.map(toDepartamentoDTO));
};

export const POST: RequestHandler = async ({ request }) => {
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

	try {
		const dep = await prisma.departamento.create({
			data: { empresaId: admin.empresaId, nome }
		});
		return jsonOk(toDepartamentoDTO(dep), 201);
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
			return jsonError('Já existe um departamento com esse nome', 409);
		}
		throw e;
	}
};
