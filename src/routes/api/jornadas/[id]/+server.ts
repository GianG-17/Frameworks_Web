import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toJornadaDTO } from '@/lib/server/jornada';
import { requireAdmin, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const PUT: RequestHandler = async ({ request, params }) => {
  let admin;
  try {
    admin = requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  let body: { nome?: string; dias?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  const existing = await prisma.jornada.findUnique({ where: { id: params.id } });
  if (!existing || existing.empresaId !== admin.empresaId) {
    return jsonError('Jornada não encontrada', 404);
  }

  const jornada = await prisma.jornada.update({
    where: { id: params.id },
    data: {
      nome: body.nome ?? undefined,
      dias: body.dias ? JSON.stringify(body.dias) : undefined
    }
  });

  return jsonOk(toJornadaDTO(jornada));
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  let admin;
  try {
    admin = requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  const existing = await prisma.jornada.findUnique({ where: { id: params.id } });
  if (!existing || existing.empresaId !== admin.empresaId) {
    return jsonError('Jornada não encontrada', 404);
  }

  await prisma.jornada.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
};
