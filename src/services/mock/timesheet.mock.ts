import type { PunchRecord, DailySummary, PunchType } from '../timesheet.service';
import { MOCK_HISTORY, decodeToken } from './data';

function getCurrentUserId(): string {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  if (!token) throw { status: 401, message: 'Não autenticado' };

  const user = decodeToken(token);
  if (!user) throw { status: 401, message: 'Token inválido' };

  return user.id;
}

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

function simulateDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 200));
}

const sessionPunches: PunchRecord[] = [];

export const timesheetMockService = {
  async punch(data: { type: PunchType; method: PunchRecord['method'] }): Promise<PunchRecord> {
    const userId = getCurrentUserId();

    const record: PunchRecord = {
      id: `punch_${Date.now()}`,
      userId,
      type: data.type,
      timestamp: new Date().toISOString(),
      method: data.method
    };

    sessionPunches.push(record);
    return simulateDelay(record);
  },

  async today(): Promise<DailySummary> {
    const userId = getCurrentUserId();
    const date = todayString();
    const history = MOCK_HISTORY[userId] ?? [];
    const fromHistory = history.find((d) => d.date === date);

    const todayPunches = [
      ...(fromHistory?.punches ?? []),
      ...sessionPunches.filter((p) => p.userId === userId && p.timestamp.startsWith(date))
    ];

    return simulateDelay({
      date,
      punches: todayPunches,
      totalHours: fromHistory?.totalHours ?? 0,
      overtime: fromHistory?.overtime ?? 0,
      deficit: fromHistory?.deficit ?? 0
    });
  },

  async history(params: { startDate: string; endDate: string }): Promise<DailySummary[]> {
    const userId = getCurrentUserId();
    const history = MOCK_HISTORY[userId] ?? [];

    const filtered = history.filter(
      (d) => d.date >= params.startDate && d.date <= params.endDate
    );

    return simulateDelay(filtered);
  }
};
