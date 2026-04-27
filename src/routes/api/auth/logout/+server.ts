import type { RequestHandler } from '@sveltejs/kit';
import { requireUser, jsonError } from '../../_lib/auth-helpers';

export const POST: RequestHandler = async ({ request }) => {
  try {
    requireUser(request);
  } catch (response) {
    return response as Response;
  }

  return new Response(null, { status: 204 });
};
