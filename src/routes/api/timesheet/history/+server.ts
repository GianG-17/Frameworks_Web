import type { RequestHandler } from '@sveltejs/kit';
import { MOCK_HISTORY } from '@/services/mock/data';
import { requireUser, jsonError, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request, url }) => {
  let user;
  try {
    user = requireUser(request);
  } catch (response) {
    return response as Response;
  }

  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  if (!startDate || !endDate) {
    return jsonError('startDate e endDate são obrigatórios', 400);
  }

  const userHistory = MOCK_HISTORY[user.id] ?? [];
  const filtered = userHistory.filter((d) => d.date >= startDate && d.date <= endDate);

  return jsonOk(filtered);
};
