import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { buildDailySummaries } from '@/lib/server/timesheet';
import { requireAdmin, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request, url }) => {
  let admin;
  try {
    admin = requireAdmin(request);
  } catch (response) {
    return response as Response;
  }

  const mes = url.searchParams.get('mes'); // "YYYY-MM"
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return jsonError('mes é obrigatório no formato YYYY-MM', 400);
  }

  const [ano, mesNum] = mes.split('-').map(Number);
  const start = new Date(Date.UTC(ano, mesNum - 1, 1));
  const end = new Date(Date.UTC(ano, mesNum, 0, 23, 59, 59, 999));

  const colaboradores = await prisma.user.findMany({
    where: { empresaId: admin.empresaId, role: 'colaborador' },
    orderBy: { name: 'asc' }
  });

  const punches = await prisma.punch.findMany({
    where: { empresaId: admin.empresaId, timestamp: { gte: start, lte: end } },
    orderBy: { timestamp: 'asc' }
  });

  const feriasMes = await prisma.ferias.findMany({
    where: {
      empresaId: admin.empresaId,
      dataInicio: { lte: end },
      dataFim: { gte: start }
    }
  });

  const justMes = await prisma.justificativa.findMany({
    where: { empresaId: admin.empresaId, data: { gte: start, lte: end } }
  });

  const byUser = new Map<string, typeof punches>();
  for (const p of punches) {
    const list = byUser.get(p.userId) ?? [];
    list.push(p);
    byUser.set(p.userId, list);
  }

  const linhas = colaboradores.map((c) => {
    const dias = buildDailySummaries(byUser.get(c.id) ?? []);
    const horas = dias.reduce((acc, d) => acc + d.totalHours, 0);
    const extras = dias.reduce((acc, d) => acc + d.overtime, 0);
    const deficit = dias.reduce((acc, d) => acc + d.deficit, 0);
    const ferias = feriasMes.filter((f) => f.colaboradorId === c.id).length;
    const faltasJustificadas = justMes.filter((j) => j.colaboradorId === c.id).length;

    return {
      colaboradorId: c.id,
      colaboradorNome: c.name,
      diasTrabalhados: dias.filter((d) => d.totalHours > 0).length,
      horas: Number(horas.toFixed(2)),
      extras: Number(extras.toFixed(2)),
      deficit: Number(deficit.toFixed(2)),
      periodosFerias: ferias,
      faltasJustificadas
    };
  });

  return jsonOk({ mes, linhas });
};
