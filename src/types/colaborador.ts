// src/types/colaborador.ts

export type StatusColaborador = 'ativo' | 'inativo' | 'ferias' | 'afastado';

export interface Colaborador {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  cargo: string;
  departamento: string;
  dataAdmissao: string; // ISO date string
  status: StatusColaborador;
  telefone?: string;
  jornadaId?: string;
}

export type ColaboradorFormData = Omit<Colaborador, 'id'>;
