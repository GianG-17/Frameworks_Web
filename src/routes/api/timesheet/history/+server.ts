import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { buildDailySummaries } from '@/lib/server/timesheet';
import { requireUser, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request, url }) => {
  let user;
  try {
    user = requireUser(request);
  } catch (response) {
    return response as Response;
  }

  const startDate = url.searchParams.get('startDate') ?? url.searchParams.get('start');
  const endDate = url.searchParams.get('endDate') ?? url.searchParams.get('end');

  if (!startDate || !endDate) {
    return jsonError('startDate e endDate são obrigatórios', 400);
  }

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T23:59:59.999Z`);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return jsonError('Datas inválidas', 400);
  }

  const punches = await prisma.punch.findMany({
    where: {
      userId: user.id,
      timestamp: { gte: start, lte: end }
    },
    orderBy: { timestamp: 'asc' }
  });

  return jsonOk(buildDailySummaries(punches));
};
