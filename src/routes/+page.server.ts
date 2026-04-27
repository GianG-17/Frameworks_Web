import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/auth/login');
  }

  if (locals.user.role === 'admin') {
    throw redirect(303, '/admin/dashboard');
  }

  if (locals.user.role === 'colaborador') {
    throw redirect(303, '/colaborador/registro');
  }

  throw redirect(303, '/auth/login');
};
