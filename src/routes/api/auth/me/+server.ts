import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toPayload } from '@/lib/server/token';
import { requireUser, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
  let tokenUser;
  try {
    tokenUser = requireUser(request);
  } catch (response) {
    return response as Response;
  }

  const user = await prisma.user.findUnique({ where: { id: tokenUser.id } });
  if (!user) return jsonError('Usuário não encontrado', 404);

  return jsonOk(toPayload(user));
};
