import type { AuthResponse } from '../auth.service';
import type { PunchRecord, DailySummary } from '../timesheet.service';

export const MOCK_USERS: AuthResponse['user'][] = [
  {
    id: 'usr_001',
    name: 'Ana Silva',
    email: 'ana@empresa.com',
    cpf: '529.982.247-25',
    role: 'admin'
  },
  {
    id: 'usr_002',
    name: 'Carlos Souza',
    email: 'carlos@empresa.com',
    cpf: '111.444.777-35',
    role: 'colaborador'
  }
];

export const MOCK_PASSWORDS: Record<string, string> = {
  'ana@empresa.com': 'Senha123',
  '52998224725': 'Senha123',
  'carlos@empresa.com': 'Senha123',
  '11144477735': 'Senha123'
};

export function findUserByIdentifier(identifier: string): AuthResponse['user'] | undefined {
  const normalized = identifier.replace(/\D/g, '');
  return MOCK_USERS.find(
    (u) => u.email === identifier || u.cpf.replace(/\D/g, '') === normalized
  );
}

function buildPunch(
  userId: string,
  type: PunchRecord['type'],
  date: string,
  time: string,
  index: number
): PunchRecord {
  return {
    id: `punch_${date}_${index}`,
    userId,
    type,
    timestamp: `${date}T${time}:00.000Z`,
    method: 'manual'
  };
}

function buildDaySummary(userId: string, date: string): DailySummary {
  const punches: PunchRecord[] = [
    buildPunch(userId, 'entrada', date, '08:00', 1),
    buildPunch(userId, 'saida_almoco', date, '12:00', 2),
    buildPunch(userId, 'retorno_almoco', date, '13:00', 3),
    buildPunch(userId, 'saida', date, '17:30', 4)
  ];

  return {
    date,
    punches,
    totalHours: 8.5,
    overtime: 0.5,
    deficit: 0
  };
}

function generateHistory(userId: string, days: number): DailySummary[] {
  const summaries: DailySummary[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dateStr = date.toISOString().split('T')[0];
    summaries.push(buildDaySummary(userId, dateStr));
  }

  return summaries;
}

export const MOCK_HISTORY: Record<string, DailySummary[]> = {
  usr_001: generateHistory('usr_001', 7),
  usr_002: generateHistory('usr_002', 7)
};

export function encodeToken(user: AuthResponse['user']): string {
  return btoa(JSON.stringify(user));
}

export function decodeToken(token: string): AuthResponse['user'] | null {
  try {
    return JSON.parse(atob(token)) as AuthResponse['user'];
  } catch {
    return null;
  }
}
