import type { Jornada, JornadaInput, JornadaService } from '../jornada.service';
import { MOCK_JORNADAS } from './data';

function simulateDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 200));
}

// Array em memória — persiste durante a sessão, seeded com os dados mock
let store: Jornada[] = [...MOCK_JORNADAS];

export const mockJornadaService: JornadaService = {
  async list(): Promise<Jornada[]> {
    return simulateDelay([...store]);
  },

  async create(data: JornadaInput): Promise<Jornada> {
    const jornada: Jornada = { id: `jornada_${Date.now()}`, ...data };
    store.push(jornada);
    return simulateDelay({ ...jornada });
  },

  async update(id: string, data: JornadaInput): Promise<Jornada> {
    const index = store.findIndex((j) => j.id === id);
    if (index === -1) throw { status: 404, message: 'Jornada não encontrada' };
    store[index] = { id, ...data };
    return simulateDelay({ ...store[index] });
  },

  async remove(id: string): Promise<void> {
    const index = store.findIndex((j) => j.id === id);
    if (index === -1) throw { status: 404, message: 'Jornada não encontrada' };
    store.splice(index, 1);
    return simulateDelay(undefined as void);
  }
};
