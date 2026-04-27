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

  const lista = await prisma.ferias.findMany({
    where: { empresaId: admin.empresaId },
    orderBy: { dataInicio: 'desc' },
    include: { colaborador: { select: { id: true, name: true } } }
  });

  return jsonOk(
    lista.map((f) => ({
      id: f.id,
      colaboradorId: f.colaboradorId,
      colaboradorNome: f.colaborador.name,
      dataInicio: f.dataInicio.toISOString(),
      dataFim: f.dataFim.toISOString(),
      observacao: f.observacao
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

  let body: Partial<{ colaboradorId: string; dataInicio: string; dataFim: string; observacao: string }>;
  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  if (!body.colaboradorId || !body.dataInicio || !body.dataFim) {
    return jsonError('colaboradorId, dataInicio e dataFim são obrigatórios', 400);
  }

  const colaborador = await prisma.user.findUnique({ where: { id: body.colaboradorId } });
  if (!colaborador || colaborador.empresaId !== admin.empresaId) {
    return jsonError('Colaborador não encontrado', 404);
  }

  const ferias = await prisma.ferias.create({
    data: {
      empresaId: admin.empresaId,
      colaboradorId: body.colaboradorId,
      dataInicio: new Date(body.dataInicio),
      dataFim: new Date(body.dataFim),
      observacao: body.observacao ?? null
    }
  });

  return jsonOk(ferias, 201);
};
