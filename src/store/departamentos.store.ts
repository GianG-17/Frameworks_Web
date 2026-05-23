// src/store/departamentos.store.ts

import { writable } from 'svelte/store';
import type { Departamento } from '../services/departamento.service';

function createDepartamentosStore() {
	const { subscribe, set, update } = writable<Departamento[]>([]);

	return {
		subscribe,
		set,
		add: (dep: Departamento) =>
			update((lista) => [...lista, dep].sort((a, b) => a.nome.localeCompare(b.nome))),
		update: (id: string, dados: Partial<Departamento>) =>
			update((lista) =>
				lista
					.map((d) => (d.id === id ? { ...d, ...dados } : d))
					.sort((a, b) => a.nome.localeCompare(b.nome))
			),
		remove: (id: string) => update((lista) => lista.filter((d) => d.id !== id)),
		reset: () => set([])
	};
}

export const departamentosStore = createDepartamentosStore();
