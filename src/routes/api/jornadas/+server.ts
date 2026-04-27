import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toJornadaDTO } from '@/lib/server/jornada';
import { requireAdmin, requireUser, jsonError, jsonOk } from '../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
  let user;
  try {
    user = requireUser(request);
  } catch (response) {
    return response as Response;
  }

  const jornadas = await prisma.jornada.findMany({
    where: { empresaId: user.empresaId },
    orderBy: { nome: 'asc' }
  });
  return jsonOk(jornadas.map(toJornadaDTO));
};

export const POST: RequestHandler = async ({ request }) => {
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

  if (!body.nome || !body.dias) {
    return jsonError('nome e dias são obrigatórios', 400);
  }

  const jornada = await prisma.jornada.create({
    data: {
      empresaId: admin.empresaId,
      nome: body.nome,
      dias: JSON.stringify(body.dias)
    }
  });

  return jsonOk(toJornadaDTO(jornada), 201);
};
