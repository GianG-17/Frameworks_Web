import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { requireAdmin, jsonError, jsonOk } from '../../_lib/auth-helpers';

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

  return jsonOk(empresa);
};

export const PUT: RequestHandler = async ({ request, params }) => {
  let admin;
  try {
    admin = requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  if (params.id !== admin.empresaId) return jsonError('Empresa não encontrada', 404);

  let body: Partial<{
    nome: string;
    cnpj: string;
    horaAbertura: string;
    horaFechamento: string;
  }>;

  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  const empresa = await prisma.empresa.update({
    where: { id: params.id },
    data: {
      nome: body.nome ?? undefined,
      cnpj: body.cnpj ?? undefined,
      horaAbertura: body.horaAbertura ?? undefined,
      horaFechamento: body.horaFechamento ?? undefined
    }
  });

  return jsonOk(empresa);
};
