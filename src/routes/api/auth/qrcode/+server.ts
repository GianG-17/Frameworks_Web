import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { encodeToken, toPayload } from '@/lib/server/token';
import { jsonError, jsonOk } from '../../_lib/auth-helpers';

export const POST: RequestHandler = async ({ request }) => {
  let body: { code?: string; timestamp?: number };

  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  if (!body.code) {
    return jsonError('QR Code inválido', 400);
  }

  const user = await prisma.user.findFirst({
    where: { role: 'colaborador', status: 'ativo' }
  });

  if (!user) return jsonError('Nenhum colaborador disponível', 404);

  const payload = toPayload(user);
  const token = encodeToken(payload);
  return jsonOk({ token, user: payload });
};
