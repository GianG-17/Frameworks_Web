// src/types/colaborador.ts

export type StatusColaborador = 'ativo' | 'inativo' | 'ferias' | 'afastado';

export interface Colaborador {
	id: string;
	nome: string;
	email: string;
	cpf: string;
	cargo: string;
	departamentoId: string | null;
	departamento: { id: string; nome: string } | null;
	dataAdmissao: string; // ISO date string
	status: StatusColaborador;
	telefone?: string;
	jornadaId?: string;
}

export interface ColaboradorFormData {
	nome: string;
	email: string;
	cpf: string;
	cargo: string;
	departamentoId: string;
	dataAdmissao: string;
	status: StatusColaborador;
	telefone?: string;
	jornadaId?: string;
}
