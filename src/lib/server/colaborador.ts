/**
 * @module lib/server/colaborador
 * @description Mapeamento Colaborador (Prisma) → ColaboradorDTO usado pelo frontend.
 */

import { Prisma } from '@prisma/client';
import type { Colaborador, Departamento } from '@prisma/client';
import { prisma } from '@/lib/server/db';
import { formatCpfInput } from '@/utils/validators';
import { jsonError } from '@/routes/api/_lib/auth-helpers';

export interface ColaboradorDTO {
	id: string;
	nome: string;
	email: string;
	cpf: string;
	cargo: string;
	departamentoId: string | null;
	departamento: { id: string; nome: string } | null;
	dataAdmissao: string;
	status: string;
	telefone?: string;
	jornadaId?: string;
}

type ColaboradorComDepartamento = Colaborador & { departamento?: Departamento | null };

export function toColaboradorDTO(user: ColaboradorComDepartamento): ColaboradorDTO {
	return {
		id: user.id,
		nome: user.name,
		email: user.email,
		cpf: formatCpfInput(user.cpf), // armazenado só com dígitos; formatado para exibição
		cargo: user.cargo ?? '',
		departamentoId: user.departamentoId ?? null,
		departamento: user.departamento
			? { id: user.departamento.id, nome: user.departamento.nome }
			: null,
		dataAdmissao: user.dataAdmissao ? user.dataAdmissao.toISOString().split('T')[0] : '',
		status: user.status ?? 'ativo',
		telefone: user.telefone ?? undefined,
		jornadaId: user.jornadaId ?? undefined
	};
}

/**
 * E-mail/CPF devem ser únicos entre colaboradores E administradores.
 * `exceptId` ignora o próprio colaborador (usado na edição).
 */
export async function emailEmUso(email: string, exceptId?: string): Promise<boolean> {
	const [colaborador, admin] = await Promise.all([
		prisma.colaborador.findFirst({
			where: { email, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
			select: { id: true }
		}),
		prisma.usuario.findFirst({ where: { email }, select: { id: true } })
	]);
	return Boolean(colaborador || admin);
}

export async function cpfEmUso(cpf: string, exceptId?: string): Promise<boolean> {
	const [colaborador, admin] = await Promise.all([
		prisma.colaborador.findFirst({
			where: { cpf, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
			select: { id: true }
		}),
		prisma.usuario.findFirst({ where: { cpf }, select: { id: true } })
	]);
	return Boolean(colaborador || admin);
}

/**
 * Rede de segurança para erros do Prisma na escrita — traduz códigos conhecidos
 * em respostas com mensagem específica. Use no `catch` de create/update.
 */
export function mapPrismaError(e: unknown): Response {
	if (e instanceof Prisma.PrismaClientKnownRequestError) {
		if (e.code === 'P2002') {
			const target = Array.isArray(e.meta?.target) ? (e.meta.target as string[]) : [];
			if (target.includes('email')) return jsonError('E-mail já cadastrado', 409, 'email');
			if (target.includes('cpf')) return jsonError('CPF já cadastrado', 409, 'cpf');
			return jsonError('Registro duplicado', 409);
		}
		if (e.code === 'P2003') {
			return jsonError('Referência inválida (departamento ou jornada inexistente)', 400);
		}
	}
	console.error('Erro inesperado ao gravar colaborador:', e);
	return jsonError('Erro ao salvar colaborador', 500);
}
