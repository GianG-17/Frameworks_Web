import type { RequestHandler } from '@sveltejs/kit';
import { MOCK_USERS, encodeToken } from '@/services/mock/data';
import { jsonError, jsonOk } from '../../_lib/auth-helpers';

export const POST: RequestHandler = async ({ request }) => {
  let body: { code?: string; timestamp?: number };

  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  if (!body.code || typeof body.timestamp !== 'number') {
    return jsonError('code e timestamp são obrigatórios', 400);
  }

  // Em modo mock, retorna sempre o primeiro colaborador
  const user = MOCK_USERS.find((u) => u.role === 'colaborador')!;
  const token = encodeToken(user);

  return jsonOk({ token, user });
};
