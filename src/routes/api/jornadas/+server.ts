import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toJornadaDTO } from '@/lib/server/jornada';
import { requireAdmin, requireUser, jsonError, jsonOk } from '../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
  // Qualquer usuário autenticado pode listar (colaboradores ainda podem precisar ver a própria jornada)
  try {
    requireUser(request);
  } catch (response) {
    return response as Response;
  }

  const jornadas = await prisma.jornada.findMany({ orderBy: { nome: 'asc' } });
  return jsonOk(jornadas.map(toJornadaDTO));
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    requireAdmin(request);
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
      nome: body.nome,
      dias: JSON.stringify(body.dias)
    }
  });

  return jsonOk(toJornadaDTO(jornada), 201);
};
