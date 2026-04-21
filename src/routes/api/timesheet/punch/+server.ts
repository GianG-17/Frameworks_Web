import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toPunchDTO } from '@/lib/server/timesheet';
import { requireUser, jsonError, jsonOk } from '../../_lib/auth-helpers';

const VALID_TYPES = ['entrada', 'saida_almoco', 'retorno_almoco', 'saida'];
const VALID_METHODS = ['qrcode', 'manual'];

export const POST: RequestHandler = async ({ request }) => {
  let user;
  try {
    user = requireUser(request);
  } catch (response) {
    return response as Response;
  }

  let body: { type?: string; method?: string; latitude?: number; longitude?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return jsonError(`type deve ser um de: ${VALID_TYPES.join(', ')}`, 400);
  }
  if (!body.method || !VALID_METHODS.includes(body.method)) {
    return jsonError(`method deve ser um de: ${VALID_METHODS.join(', ')}`, 400);
  }

  const punch = await prisma.punch.create({
    data: {
      userId: user.id,
      type: body.type,
      method: body.method,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null
    }
  });

  return jsonOk(toPunchDTO(punch), 201);
};
