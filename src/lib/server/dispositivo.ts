/**
 * @module lib/server/dispositivo
 * @description Autenticação de dispositivos de ponto biométrico (ESP32).
 *
 * Diferente de colaboradores/admins, o aparelho de parede autentica-se por um
 * token opaco próprio (header `Authorization: Bearer <DEVICE_TOKEN>`), que resolve
 * a empresa. Nenhum colaborador está logado nessas chamadas.
 */

import { prisma } from '@/lib/server/db';
import type { Dispositivo } from '@/lib/server/prisma-client/client';

/** Resposta de erro JSON no mesmo formato de `auth-helpers.jsonError`. */
function erro(message: string, status: number): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

/**
 * Valida o Bearer token do dispositivo e retorna o registro correspondente.
 * Lança um `Response` quando o token é ausente/inválido ou o dispositivo está
 * inativo.
 */
export async function requireDispositivo(request: Request): Promise<Dispositivo> {
	const header = request.headers.get('Authorization');
	const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
	if (!token) throw erro('Dispositivo não autenticado', 401);

	const dispositivo = await prisma.dispositivo.findUnique({ where: { token } });
	if (!dispositivo) throw erro('Dispositivo inválido', 401);
	if (!dispositivo.ativo) throw erro('Dispositivo desativado', 403);

	return dispositivo;
}
