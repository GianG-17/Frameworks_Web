import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { requireDispositivo } from '@/lib/server/dispositivo';
import { proximoTipo, toRegistroDTO } from '@/lib/server/timesheet';
import { jsonError, jsonOk } from '../../_lib/auth-helpers';

/**
 * POST /api/biometria/marcacao
 * Chamado pelo DISPOSITIVO (Bearer DEVICE_TOKEN) quando uma digital é
 * reconhecida. Identifica o colaborador pelo `funcionarioId` (= biometriaId) e
 * registra o ponto, determinando o tipo automaticamente pela sequência do dia.
 */
export const POST: RequestHandler = async ({ request }) => {
	let dispositivo;
	try {
		dispositivo = await requireDispositivo(request);
	} catch (response) {
		return response as Response;
	}

	let body: { deviceId?: string; funcionarioId?: number | string };
	try {
		body = await request.json();
	} catch {
		return jsonError('Corpo da requisição inválido', 400);
	}

	if (body.deviceId && body.deviceId !== dispositivo.deviceId) {
		return jsonError('deviceId não confere com o token', 400);
	}
	// funcionarioId é o ID (pequeno) da digital — não o CPF (CPF estoura o INT).
	const funcionarioId = Number(body.funcionarioId);
	if (!Number.isInteger(funcionarioId) || funcionarioId < 1 || funcionarioId > 2147483647) {
		return jsonError(
			'funcionarioId deve ser um inteiro válido (o número da digital, não o CPF)',
			400
		);
	}

	const colaborador = await prisma.colaborador.findFirst({
		where: { empresaId: dispositivo.empresaId, biometriaId: funcionarioId }
	});
	if (!colaborador) {
		return jsonError('Biometria não reconhecida', 404);
	}

	// Batidas válidas de hoje (limites do dia em UTC, como em /timesheet/today).
	const now = new Date();
	const start = new Date(now);
	start.setUTCHours(0, 0, 0, 0);
	const end = new Date(now);
	end.setUTCHours(23, 59, 59, 999);

	const registrosHoje = await prisma.registro.findMany({
		where: { colaboradorId: colaborador.id, timestamp: { gte: start, lte: end } },
		include: { anulacao: true }
	});

	const type = proximoTipo(registrosHoje);
	if (!type) {
		return jsonError('Jornada do dia já completa', 409);
	}

	const registro = await prisma.registro.create({
		data: {
			colaboradorId: colaborador.id,
			empresaId: dispositivo.empresaId,
			type,
			method: 'biometria',
			deviceId: dispositivo.deviceId
		}
	});

	return jsonOk({ colaborador: colaborador.name, type, registro: toRegistroDTO(registro) }, 201);
};
