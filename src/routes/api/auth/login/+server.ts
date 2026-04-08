import type { RequestHandler } from '@sveltejs/kit';
import { findUserByIdentifier, MOCK_PASSWORDS, encodeToken } from '@/services/mock/data';
import { jsonError, jsonOk } from '../../_lib/auth-helpers';

export const POST: RequestHandler = async ({ request }) => {
  let body: { identifier?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  const { identifier, password } = body;

  if (!identifier || !password) {
    return jsonError('identifier e password são obrigatórios', 400);
  }

  const user = findUserByIdentifier(identifier);
  if (!user) return jsonError('Credenciais inválidas', 401);

  const normalizedId = identifier.includes('@') ? identifier : identifier.replace(/\D/g, '');
  const expectedPassword = MOCK_PASSWORDS[normalizedId] ?? MOCK_PASSWORDS[identifier];

  if (expectedPassword !== password) {
    return jsonError('Credenciais inválidas', 401);
  }

  const token = encodeToken(user);
  return jsonOk({ token, user });
};
