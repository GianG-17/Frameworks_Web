import type { RequestHandler } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/server/db';
import { encodeToken, toPayload } from '@/lib/server/token';
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

  const isEmail = identifier.includes('@');
  const normalizedCpf = identifier.replace(/\D/g, '');

  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: identifier }
      : {
          OR: [
            { cpf: identifier },
            { cpf: formatCpf(normalizedCpf) }
          ]
        }
  });

  if (!user) return jsonError('Credenciais inválidas', 401);

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return jsonError('Credenciais inválidas', 401);

  const payload = toPayload(user);
  const token = encodeToken(payload);

  return jsonOk({ token, user: payload });
};

function formatCpf(digits: string): string {
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
