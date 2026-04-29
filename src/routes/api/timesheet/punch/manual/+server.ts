/**
 * @endpoint POST /api/timesheet/punch/manual
 * @description Admin cria batida retroativa para um colaborador da própria empresa.
 *
 * Conformidade Portaria 671/2021: a batida é criada como registro novo (imutável)
 * com `method: 'manual'`, `createdBy = adminId` e `createdReason` obrigatório.
 * Não substitui nem altera batidas existentes.
 */
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toPunchDTO } from '@/lib/server/timesheet';
import { requireAdmin, jsonError, jsonOk } from '../../../_lib/auth-helpers';

const VALID_TYPES = ['entrada', 'saida_almoco', 'retorno_almoco', 'saida'];

export const POST: RequestHandler = async ({ request }) => {
  let admin;
  try {
    admin = requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  let body: {
    userId?: string;
    type?: string;
    timestamp?: string;
    reason?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  if (!body.userId) return jsonError('userId é obrigatório', 400);
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return jsonError(`type deve ser um de: ${VALID_TYPES.join(', ')}`, 400);
  }
  if (!body.timestamp) return jsonError('timestamp é obrigatório', 400);
  const ts = new Date(body.timestamp);
  if (isNaN(ts.getTime())) return jsonError('timestamp inválido', 400);
  if (ts.getTime() > Date.now()) {
    return jsonError('Não é permitido registrar batida no futuro', 400);
  }
  if (!body.reason || body.reason.trim().length < 5) {
    return jsonError('Motivo é obrigatório (mínimo 5 caracteres)', 400);
  }

  const colaborador = await prisma.user.findUnique({ where: { id: body.userId } });
  if (!colaborador || colaborador.empresaId !== admin.empresaId) {
    return jsonError('Colaborador não encontrado', 404);
  }

  const punch = await prisma.punch.create({
    data: {
      userId: colaborador.id,
      empresaId: admin.empresaId,
      type: body.type,
      timestamp: ts,
      method: 'manual',
      createdBy: admin.id,
      createdReason: body.reason.trim()
    },
    include: { anulacao: true }
  });

  return jsonOk(toPunchDTO(punch), 201);
};
