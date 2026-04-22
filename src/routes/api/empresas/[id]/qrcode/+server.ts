import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { generateToken, secondsUntilNext, buildOtpauthUrl } from '@/lib/server/totp';
import { requireAdmin, jsonError, jsonOk } from '../../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request, params }) => {
  let admin;
  try {
    admin = requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  if (params.id !== admin.empresaId) return jsonError('Empresa não encontrada', 404);

  const empresa = await prisma.empresa.findUnique({ where: { id: params.id } });
  if (!empresa) return jsonError('Empresa não encontrada', 404);

  const currentToken = generateToken(empresa.qrSecret);
  const expiresInSeconds = secondsUntilNext();
  const otpauthUrl = buildOtpauthUrl(empresa.qrSecret, empresa.nome);

  // Payload que o colaborador vai escanear: empresaId + token TOTP
  const qrPayload = JSON.stringify({ empresaId: empresa.id, token: currentToken });

  return jsonOk({
    empresaId: empresa.id,
    currentToken,
    expiresInSeconds,
    otpauthUrl,
    qrPayload
  });
};
