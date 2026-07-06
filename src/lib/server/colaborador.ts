/**
 * @module lib/server/colaborador
 * @description Mapeamento Colaborador (Prisma) → ColaboradorDTO usado pelo frontend.
 *
 * Colaborador é extensão 1:1 de Usuario (identidade). Nome/e-mail/CPF vivem em
 * `usuario`; unicidade de e-mail/CPF é por empresa na tabela `usuarios`.
 */

import { Prisma } from '@/lib/server/prisma-client/client';
import type { Colaborador, Departamento, Usuario } from '@/lib/server/prisma-client/client';
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

type ColaboradorComRelacoes = Colaborador & {
	usuario: Pick<Usuario, 'nome' | 'email' | 'cpf'>;
	departamento?: Departamento | null;
};

export function toColaboradorDTO(colaborador: ColaboradorComRelacoes): ColaboradorDTO {
	return {
		id: colaborador.id,
		nome: colaborador.usuario.nome,
		email: colaborador.usuario.email,
		// armazenado só com dígitos; formatado para exibição
		cpf: formatCpfInput(colaborador.usuario.cpf),
		cargo: colaborador.cargo ?? '',
		departamentoId: colaborador.departamentoId ?? null,
		departamento: colaborador.departamento
			? { id: colaborador.departamento.id, nome: colaborador.departamento.nome }
			: null,
		dataAdmissao: colaborador.dataAdmissao
			? colaborador.dataAdmissao.toISOString().split('T')[0]
			: '',
		status: colaborador.status ?? 'ativo',
		telefone: colaborador.telefone ?? undefined,
		jornadaId: colaborador.jornadaId ?? undefined
	};
}

/**
 * E-mail único entre as identidades (`usuarios`) da empresa.
 * `exceptUsuarioId` ignora a própria identidade (usado na edição).
 */
export async function emailEmUso(
	email: string,
	empresaId: string,
	exceptUsuarioId?: string
): Promise<boolean> {
	const usuario = await prisma.usuario.findFirst({
		where: { empresaId, email, ...(exceptUsuarioId ? { NOT: { id: exceptUsuarioId } } : {}) },
		select: { id: true }
	});
	return Boolean(usuario);
}

export async function cpfEmUso(
	cpf: string,
	empresaId: string,
	exceptUsuarioId?: string
): Promise<boolean> {
	const usuario = await prisma.usuario.findFirst({
		where: { empresaId, cpf, ...(exceptUsuarioId ? { NOT: { id: exceptUsuarioId } } : {}) },
		select: { id: true }
	});
	return Boolean(usuario);
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
