/**
 * @module lib/schemas/colaborador.schema
 * @description Schema Zod isomórfico (client + server) para validação de colaborador.
 * Fonte única das regras de formato/obrigatoriedade; regras de negócio que dependem
 * do banco (duplicidade de e-mail/CPF, existência de departamento/jornada) ficam no endpoint.
 */

import { z } from 'zod';
import { isValidCpf, isValidEmail } from '@/utils/validators';

const status = z.enum(['ativo', 'inativo', 'ferias', 'afastado']);

// Regras de cada campo SEM defaults — compartilhadas entre create (com defaults)
// e update (parcial). Defaults no update parcial sobrescreveriam campos ausentes.
const campos = {
	nome: z.string().trim().min(1, 'Nome é obrigatório'),
	email: z
		.string()
		.trim()
		.min(1, 'E-mail é obrigatório')
		.refine(isValidEmail, 'E-mail inválido')
		.transform((v) => v.toLowerCase()),
	// Canoniza para somente dígitos — evita duplicado "043.468.950-50" vs "04346895050".
	cpf: z
		.string()
		.trim()
		.min(1, 'CPF é obrigatório')
		.refine(isValidCpf, 'CPF inválido')
		.transform((v) => v.replace(/\D/g, '')),
	cargo: z.string().trim().min(1, 'Cargo é obrigatório'),
	departamentoId: z.string().trim().min(1, 'Departamento é obrigatório'),
	dataAdmissao: z.string().trim().min(1, 'Data de admissão é obrigatória'),
	status,
	telefone: z.string().trim(),
	// '' ou ausente → null (colaborador sem jornada vinculada)
	jornadaId: z.preprocess(
		(v) => (typeof v === 'string' && v.trim() ? v : null),
		z.string().nullable()
	)
};

export const colaboradorCreateSchema = z.object({
	...campos,
	status: status.default('ativo'),
	telefone: campos.telefone.optional().default('')
});

export const colaboradorUpdateSchema = z.object(campos).partial();

export type ColaboradorCreateInput = z.infer<typeof colaboradorCreateSchema>;
export type ColaboradorUpdateInput = z.infer<typeof colaboradorUpdateSchema>;
