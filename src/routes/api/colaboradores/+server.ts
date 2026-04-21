import type { RequestHandler } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/server/db';
import { toColaboradorDTO } from '@/lib/server/colaborador';
import { requireAdmin, jsonError, jsonOk } from '../_lib/auth-helpers';

const SENHA_PADRAO = 'Senha123';

export const GET: RequestHandler = async ({ request }) => {
  try {
    requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  const users = await prisma.user.findMany({
    where: { role: 'colaborador' },
    orderBy: { name: 'asc' }
  });

  return jsonOk(users.map(toColaboradorDTO));
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    requireAdmin(request);
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
    jornadaId: string;
  }>;

  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  if (!body.nome || !body.email || !body.cpf) {
    return jsonError('nome, email e cpf são obrigatórios', 400);
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: body.email }, { cpf: body.cpf }] }
  });
  if (existing) {
    return jsonError('E-mail ou CPF já cadastrado', 409);
  }

  const user = await prisma.user.create({
    data: {
      name: body.nome,
      email: body.email,
      cpf: body.cpf,
      password: await bcrypt.hash(SENHA_PADRAO, 10),
      role: 'colaborador',
      cargo: body.cargo ?? null,
      departamento: body.departamento ?? null,
      telefone: body.telefone ?? null,
      dataAdmissao: body.dataAdmissao ? new Date(body.dataAdmissao) : null,
      status: body.status ?? 'ativo',
      jornadaId: body.jornadaId ?? null
    }
  });

  return jsonOk(toColaboradorDTO(user), 201);
};
