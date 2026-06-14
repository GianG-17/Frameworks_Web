import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { requireDispositivo } from '@/lib/server/dispositivo';
import { jsonError, jsonOk } from '../../_lib/auth-helpers';

/**
 * POST /api/biometria/cadastro
 * Chamado pelo DISPOSITIVO (Bearer DEVICE_TOKEN) ao concluir a captura de uma
 * digital. O próprio dispositivo informa de quem é a biometria pelo CPF; o
 * backend acha o colaborador (na empresa do device) e grava o `biometriaId`.
 */
export const POST: RequestHandler = async ({ request }) => {
	let dispositivo;
	try {
		dispositivo = await requireDispositivo(request);
	} catch (response) {
		return response as Response;
	}

	let body: { deviceId?: string; cpf?: string | number; biometriaId?: number | string };
	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	if (body.deviceId && body.deviceId !== dispositivo.deviceId) {
		return jsonError('deviceId não confere com o token', 400);
	}
	// biometriaId é o número (pequeno) da digital — cabe num INT. Um CPF estoura o int.
	const biometriaId = Number(body.biometriaId);
	if (!Number.isInteger(biometriaId) || biometriaId < 1 || biometriaId > 2147483647) {
		return jsonError('biometriaId deve ser um inteiro válido (1..2147483647)', 400);
	}
	// Envie o cpf como string (preserva zeros à esquerda); aceitamos número por robustez.
	const cpf = String(body.cpf ?? '').replace(/\D/g, '');
	if (!cpf) {
		return jsonError('cpf é obrigatório', 400);
	}

	// Colaborador identificado pelo CPF, dentro da empresa do dispositivo.
	const colaborador = await prisma.colaborador.findFirst({
		where: { empresaId: dispositivo.empresaId, cpf }
	});
	if (!colaborador) {
		return jsonError('Colaborador não encontrado para este CPF', 404);
	}

	// O ID já está em uso por outro colaborador da empresa?
	const emUso = await prisma.colaborador.findFirst({
		where: {
			empresaId: dispositivo.empresaId,
			biometriaId,
			id: { not: colaborador.id }
		}
	});
	if (emUso) {
		return jsonError('Este ID biométrico já está cadastrado para outro colaborador', 409);
	}

	await prisma.colaborador.update({
		where: { id: colaborador.id },
		data: { biometriaId }
	});

	return jsonOk({ colaborador: colaborador.name, biometriaId }, 201);
};
