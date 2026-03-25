/**
 * @module app.d.ts
 * @description Tipos globais do SvelteKit — estende Locals, PageData, etc.
 */

declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        name: string;
        email: string;
        role: 'admin' | 'colaborador';
      } | null;
    }

    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
