// src/store/colaboradores.store.ts

import { writable, derived } from 'svelte/store';
import type { Colaborador } from '../types/colaborador';

function createColaboradoresStore() {
  const { subscribe, set, update } = writable<Colaborador[]>([]);

  return {
    subscribe,

    set,

    add: (colaborador: Colaborador) =>
      update((lista) => [...lista, colaborador]),

    update: (id: string, dados: Partial<Colaborador>) =>
      update((lista) =>
        lista.map((c) => (c.id === id ? { ...c, ...dados } : c))
      ),

    remove: (id: string) =>
      update((lista) => lista.filter((c) => c.id !== id)),

    reset: () => set([])
  };
}

export const colaboradoresStore = createColaboradoresStore();

// Store derivado: apenas colaboradores ativos
export const colaboradoresAtivos = derived(colaboradoresStore, ($lista) =>
  $lista.filter((c) => c.status === 'ativo')
);
