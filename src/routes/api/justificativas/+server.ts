import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { requireAdmin, jsonError, jsonOk } from '../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
  let admin;
  try {
    admin = requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  const lista = await prisma.justificativa.findMany({
    where: { empresaId: admin.empresaId },
    orderBy: { data: 'desc' },
    include: { colaborador: { select: { id: true, name: true } } }
  });

  return jsonOk(
    lista.map((j) => ({
      id: j.id,
      colaboradorId: j.colaboradorId,
      colaboradorNome: j.colaborador.name,
      data: j.data.toISOString(),
      motivo: j.motivo,
      anexoUrl: j.anexoUrl
    }))
  );
};

export const POST: RequestHandler = async ({ request }) => {
  let admin;
  try {
    admin = requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  let body: Partial<{ colaboradorId: string; data: string; motivo: string; anexoUrl: string }>;
  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  if (!body.colaboradorId || !body.data || !body.motivo) {
    return jsonError('colaboradorId, data e motivo são obrigatórios', 400);
  }

  const colaborador = await prisma.user.findUnique({ where: { id: body.colaboradorId } });
  if (!colaborador || colaborador.empresaId !== admin.empresaId) {
    return jsonError('Colaborador não encontrado', 404);
  }

  const justificativa = await prisma.justificativa.create({
    data: {
      empresaId: admin.empresaId,
      colaboradorId: body.colaboradorId,
      data: new Date(body.data),
      motivo: body.motivo,
      anexoUrl: body.anexoUrl ?? null
    }
  });

  return jsonOk(justificativa, 201);
};
