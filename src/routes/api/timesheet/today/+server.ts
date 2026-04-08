import type { RequestHandler } from '@sveltejs/kit';
import type { DailySummary } from '@/services/timesheet.service';
import { MOCK_HISTORY } from '@/services/mock/data';
import { requireUser, jsonOk } from '../../_lib/auth-helpers';
import { sessionPunches } from '../../_lib/session-store';

export const GET: RequestHandler = async ({ request }) => {
  let user;
  try {
    user = requireUser(request);
  } catch (response) {
    return response as Response;
  }

  const today = new Date().toISOString().split('T')[0];
  const userHistory = MOCK_HISTORY[user.id] ?? [];
  const mockToday = userHistory.find((d) => d.date === today);

  const todaySessionPunches = sessionPunches.filter(
    (p) => p.userId === user.id && p.timestamp.startsWith(today)
  );

  const summary: DailySummary = mockToday
    ? { ...mockToday, punches: [...mockToday.punches, ...todaySessionPunches] }
    : {
        date: today,
        punches: todaySessionPunches,
        totalHours: 0,
        overtime: 0,
        deficit: 0
      };

  return jsonOk(summary);
};
