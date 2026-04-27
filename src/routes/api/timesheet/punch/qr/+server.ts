import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { verifyToken } from '@/lib/server/totp';
import { toPunchDTO } from '@/lib/server/timesheet';
import { requireUser, jsonError, jsonOk } from '../../../_lib/auth-helpers';

const VALID_TYPES = ['entrada', 'saida_almoco', 'retorno_almoco', 'saida'];

export const POST: RequestHandler = async ({ request }) => {
  let user;
  try {
    user = requireUser(request);
  } catch (response) {
    return response as Response;
  }

  let body: { empresaId?: string; token?: string; type?: string; latitude?: number; longitude?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  if (!body.empresaId || !body.token || !body.type) {
    return jsonError('empresaId, token e type são obrigatórios', 400);
  }
  if (!VALID_TYPES.includes(body.type)) {
    return jsonError(`type deve ser um de: ${VALID_TYPES.join(', ')}`, 400);
  }
  if (body.empresaId !== user.empresaId) {
    return jsonError('QR Code de outra empresa', 403);
  }

  const empresa = await prisma.empresa.findUnique({ where: { id: body.empresaId } });
  if (!empresa) return jsonError('Empresa não encontrada', 404);

  if (!verifyToken(body.token, empresa.qrSecret)) {
    return jsonError('QR Code expirado ou inválido', 401);
  }

  const punch = await prisma.punch.create({
    data: {
      userId: user.id,
      empresaId: empresa.id,
      type: body.type,
      method: 'qrcode',
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null
    }
  });

  return jsonOk(toPunchDTO(punch), 201);
};
