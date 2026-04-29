/**
 * @endpoint POST /api/timesheet/punch/[id]/anular
 * @description Admin cria registro de anulação para uma batida da própria empresa.
 *
 * Conformidade Portaria 671/2021: a batida original NÃO é alterada nem removida.
 * Cria-se um registro paralelo (PunchAnulacao) que invalida a batida no cálculo
 * do espelho, mas mantém ambos visíveis para o AFD legal.
 */
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { toPunchDTO } from '@/lib/server/timesheet';
import { requireAdmin, jsonError, jsonOk } from '../../../../_lib/auth-helpers';

export const POST: RequestHandler = async ({ request, params }) => {
  let admin;
  try {
    admin = requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  const punchId = params.id;
  if (!punchId) return jsonError('id é obrigatório', 400);

  let body: { motivo?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  if (!body.motivo || body.motivo.trim().length < 5) {
    return jsonError('Motivo é obrigatório (mínimo 5 caracteres)', 400);
  }

  const punch = await prisma.punch.findUnique({
    where: { id: punchId },
    include: { anulacao: true }
  });

  if (!punch || punch.empresaId !== admin.empresaId) {
    return jsonError('Batida não encontrada', 404);
  }

  if (punch.anulacao) {
    return jsonError('Batida já anulada', 409);
  }

  await prisma.punchAnulacao.create({
    data: {
      punchId: punch.id,
      empresaId: admin.empresaId,
      motivo: body.motivo.trim(),
      anuladoPor: admin.id
    }
  });

  const atualizado = await prisma.punch.findUnique({
    where: { id: punchId },
    include: { anulacao: true }
  });

  return jsonOk(toPunchDTO(atualizado!), 201);
};
