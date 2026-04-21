import type { RequestHandler } from '@sveltejs/kit';
import { MOCK_USERS, MOCK_HISTORY } from '@/services/mock/data';
import { requireUser, jsonError, jsonOk } from '../../_lib/auth-helpers';
import { sessionPunches } from '../../_lib/session-store';

export const GET: RequestHandler = async ({ request }) => {
  let user;
  try {
    user = requireUser(request);
  } catch (response) {
    return response as Response;
  }

  if (user.role !== 'admin') {
    return jsonError('Acesso restrito a administradores', 403);
  }

  const colaboradores = MOCK_USERS.filter((u) => u.role === 'colaborador');

  const today = new Date().toISOString().split('T')[0];

  const pontosHojeMock = colaboradores.reduce((total, c) => {
    const userToday = (MOCK_HISTORY[c.id] ?? []).find((d) => d.date === today);
    return total + (userToday?.punches.length ?? 0);
  }, 0);

  const pontosHojeSessao = sessionPunches.filter((p) =>
    p.timestamp.startsWith(today)
  ).length;

  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let horasExtrasMes = 0;
  for (const c of colaboradores) {
    const historico = MOCK_HISTORY[c.id] ?? [];
    for (const dia of historico) {
      if (dia.date.startsWith(mesAtual)) {
        horasExtrasMes += dia.overtime ?? 0;
      }
    }
  }

  return jsonOk({
    colaboradoresAtivos: colaboradores.length,
    pontosHoje: pontosHojeMock + pontosHojeSessao,
    totalColaboradores: MOCK_USERS.length,
    horasExtrasMes: Number(horasExtrasMes.toFixed(1))
  });
};
