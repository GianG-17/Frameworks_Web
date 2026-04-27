import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { buildSummary, dateKey } from '@/lib/server/timesheet';
import { requireUser, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
  let user;
  try {
    user = requireUser(request);
  } catch (response) {
    return response as Response;
  }

  const now = new Date();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setUTCHours(23, 59, 59, 999);

  const punches = await prisma.punch.findMany({
    where: {
      userId: user.id,
      timestamp: { gte: start, lte: end }
    },
    orderBy: { timestamp: 'asc' }
  });

  return jsonOk(buildSummary(dateKey(now), punches));
};
