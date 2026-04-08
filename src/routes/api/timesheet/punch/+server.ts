import type { RequestHandler } from '@sveltejs/kit';
import type { PunchRecord } from '@/services/timesheet.service';
import { requireUser, jsonError, jsonOk } from '../../_lib/auth-helpers';
import { sessionPunches } from '../../_lib/session-store';

const VALID_TYPES: PunchRecord['type'][] = ['entrada', 'saida_almoco', 'retorno_almoco', 'saida'];
const VALID_METHODS: PunchRecord['method'][] = ['qrcode', 'manual'];

export const POST: RequestHandler = async ({ request }) => {
  let user;
  try {
    user = requireUser(request);
  } catch (response) {
    return response as Response;
  }

  let body: { type?: string; method?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  if (!body.type || !VALID_TYPES.includes(body.type as PunchRecord['type'])) {
    return jsonError(`type deve ser um de: ${VALID_TYPES.join(', ')}`, 400);
  }
  if (!body.method || !VALID_METHODS.includes(body.method as PunchRecord['method'])) {
    return jsonError(`method deve ser um de: ${VALID_METHODS.join(', ')}`, 400);
  }

  const punch: PunchRecord = {
    id: `punch_${Date.now()}`,
    userId: user.id,
    type: body.type as PunchRecord['type'],
    timestamp: new Date().toISOString(),
    method: body.method as PunchRecord['method']
  };

  sessionPunches.push(punch);

  return jsonOk(punch, 201);
};
