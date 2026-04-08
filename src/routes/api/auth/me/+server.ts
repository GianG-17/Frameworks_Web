import type { RequestHandler } from '@sveltejs/kit';
import { requireUser, jsonOk } from '../../_lib/auth-helpers';

export const GET: RequestHandler = async ({ request }) => {
  let user;
  try {
    user = requireUser(request);
  } catch (response) {
    return response as Response;
  }

  return jsonOk(user);
};
