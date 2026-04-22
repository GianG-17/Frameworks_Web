import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { requireAdmin, jsonError } from '../../_lib/auth-helpers';

export const DELETE: RequestHandler = async ({ request, params }) => {
  let admin;
  try {
    admin = requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  const existing = await prisma.ferias.findUnique({ where: { id: params.id } });
  if (!existing || existing.empresaId !== admin.empresaId) {
    return jsonError('Férias não encontradas', 404);
  }

  await prisma.ferias.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
};
