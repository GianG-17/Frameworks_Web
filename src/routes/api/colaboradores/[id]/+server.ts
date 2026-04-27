import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toColaboradorDTO } from '@/lib/server/colaborador';
import { requireAdmin, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request, params }) => {
  let admin;
  try {
    admin = requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user || user.role !== 'colaborador' || user.empresaId !== admin.empresaId) {
    return jsonError('Colaborador não encontrado', 404);
  }

  return jsonOk(toColaboradorDTO(user));
};

export const PUT: RequestHandler = async ({ request, params }) => {
  let admin;
  try {
    admin = requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  let body: Partial<{
    nome: string;
    email: string;
    cpf: string;
    cargo: string;
    departamento: string;
    dataAdmissao: string;
    status: string;
    telefone: string;
    jornadaId: string | null;
  }>;

  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing || existing.role !== 'colaborador' || existing.empresaId !== admin.empresaId) {
    return jsonError('Colaborador não encontrado', 404);
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      name: body.nome ?? undefined,
      email: body.email ?? undefined,
      cpf: body.cpf ?? undefined,
      cargo: body.cargo ?? undefined,
      departamento: body.departamento ?? undefined,
      telefone: body.telefone ?? undefined,
      dataAdmissao: body.dataAdmissao ? new Date(body.dataAdmissao) : undefined,
      status: body.status ?? undefined,
      jornadaId: body.jornadaId === null ? null : body.jornadaId ?? undefined
    }
  });

  return jsonOk(toColaboradorDTO(user));
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  let admin;
  try {
    admin = requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing || existing.role !== 'colaborador' || existing.empresaId !== admin.empresaId) {
    return jsonError('Colaborador não encontrado', 404);
  }

  await prisma.user.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
};
