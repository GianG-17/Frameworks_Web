import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { buildDailySummaries } from '@/lib/server/timesheet';
import { requireAdmin, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
  try {
    requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  const [totalColaboradores, colaboradoresAtivos, totalUsuarios] = await Promise.all([
    prisma.user.count({ where: { role: 'colaborador' } }),
    prisma.user.count({ where: { role: 'colaborador', status: 'ativo' } }),
    prisma.user.count()
  ]);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setUTCHours(23, 59, 59, 999);

  const pontosHoje = await prisma.punch.count({
    where: { timestamp: { gte: todayStart, lte: todayEnd } }
  });

  const mesStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const mesEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  const punchesMes = await prisma.punch.findMany({
    where: { timestamp: { gte: mesStart, lte: mesEnd } },
    orderBy: { timestamp: 'asc' }
  });

  // Agrupa por usuário para calcular horas extras corretas por dia
  const byUser = new Map<string, typeof punchesMes>();
  for (const p of punchesMes) {
    const list = byUser.get(p.userId) ?? [];
    list.push(p);
    byUser.set(p.userId, list);
  }

  let horasExtrasMes = 0;
  for (const userPunches of byUser.values()) {
    const summaries = buildDailySummaries(userPunches);
    horasExtrasMes += summaries.reduce((acc, s) => acc + s.overtime, 0);
  }

  return jsonOk({
    colaboradoresAtivos,
    pontosHoje,
    totalColaboradores: totalUsuarios,
    horasExtrasMes: Number(horasExtrasMes.toFixed(1))
  });
};
