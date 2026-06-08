import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '@/lib/server/db';
import { buildDailySummaries, dateKey } from '@/lib/server/timesheet';
import { requireAdmin, jsonOk } from '../../_lib/auth-helpers';

const DIAS_KEYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'] as const;
type DiaKey = (typeof DIAS_KEYS)[number];

interface DiaJornada {
	ativo: boolean;
	entrada: string;
	saida_almoco: string;
	retorno_almoco: string;
	saida: string;
}
type JornadaDias = Record<DiaKey, DiaJornada>;

const TOLERANCIA_ATRASO_MIN = 10;

function diaKeyFromDate(date: Date): DiaKey {
	return DIAS_KEYS[date.getUTCDay()];
}

function timeStringToMinutes(time: string): number | null {
	const m = /^(\d{2}):(\d{2})$/.exec(time);
	if (!m) return null;
	return Number(m[1]) * 60 + Number(m[2]);
}

export const GET: RequestHandler = async ({ request, url }) => {
	let admin;
	try {
		admin = requireAdmin(request);
	} catch (response) {
		return response as Response;
	}

	const empresaId = admin.empresaId;

	// Permite escolher uma data específica para inspecionar (?data=YYYY-MM-DD).
	const dataParam = url.searchParams.get('data');
	const refDate = dataParam ? new Date(`${dataParam}T12:00:00.000Z`) : new Date();
	const refKey = dateKey(refDate);
	const refDayStart = new Date(`${refKey}T00:00:00.000Z`);
	const refDayEnd = new Date(`${refKey}T23:59:59.999Z`);

	// ── KPIs simples ───────────────────────────────────────────────────────────
	const [totalColaboradores, colaboradoresAtivos] = await Promise.all([
		prisma.colaborador.count({ where: { empresaId } }),
		prisma.colaborador.count({ where: { status: 'ativo', empresaId } })
	]);

	const pontosHoje = await prisma.registro.count({
		where: { empresaId, timestamp: { gte: refDayStart, lte: refDayEnd } }
	});

	// ── Janela do mês de referência ────────────────────────────────────────────
	const mesStart = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), 1));
	const mesEnd = new Date(
		Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth() + 1, 0, 23, 59, 59, 999)
	);

	const registrosMes = await prisma.registro.findMany({
		where: { empresaId, timestamp: { gte: mesStart, lte: mesEnd } },
		orderBy: { timestamp: 'asc' }
	});

	// Index por usuário
	const registrosPorColaborador = new Map<string, typeof registrosMes>();
	for (const p of registrosMes) {
		const list = registrosPorColaborador.get(p.colaboradorId) ?? [];
		list.push(p);
		registrosPorColaborador.set(p.colaboradorId, list);
	}

	// Soma horas extras / déficit por dia (todos os colaboradores) e por colaborador
	const extrasPorDia = new Map<string, number>();
	const extrasPorUser = new Map<string, number>();
	const deficitPorUser = new Map<string, number>();

	for (const [userId, list] of registrosPorColaborador.entries()) {
		const sumarios = buildDailySummaries(list);
		let extrasUser = 0;
		let deficitUser = 0;
		for (const s of sumarios) {
			extrasPorDia.set(s.date, (extrasPorDia.get(s.date) ?? 0) + s.overtime);
			extrasUser += s.overtime;
			deficitUser += s.deficit;
		}
		extrasPorUser.set(userId, extrasUser);
		deficitPorUser.set(userId, deficitUser);
	}

	const horasExtrasMes = Array.from(extrasPorUser.values()).reduce((a, b) => a + b, 0);
	const horasDeficitMes = Array.from(deficitPorUser.values()).reduce((a, b) => a + b, 0);

	// Série diária: lista de todos os dias do mês (preenche 0 onde não há dado)
	const horasExtrasPorDia: { date: string; horas: number }[] = [];
	const ultimoDiaMes = mesEnd.getUTCDate();
	for (let d = 1; d <= ultimoDiaMes; d++) {
		const iso = `${refDate.getUTCFullYear()}-${String(refDate.getUTCMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		horasExtrasPorDia.push({
			date: iso,
			horas: Number((extrasPorDia.get(iso) ?? 0).toFixed(2))
		});
	}

	// ── Top 5 horas extras no mês ──────────────────────────────────────────────
	const colaboradores = await prisma.colaborador.findMany({
		where: { empresaId },
		select: {
			id: true,
			name: true,
			status: true,
			jornada: { select: { dias: true } }
		}
	});

	const topExtras = [...extrasPorUser.entries()]
		.map(([userId, horas]) => {
			const c = colaboradores.find((x) => x.id === userId);
			return { colaboradorId: userId, nome: c?.name ?? '—', horas: Number(horas.toFixed(2)) };
		})
		.filter((row) => row.horas > 0)
		.sort((a, b) => b.horas - a.horas)
		.slice(0, 5);

	// ── Entradas do dia (status: pontual / atrasado / falta / sem_jornada) ────
	const registrosDia = await prisma.registro.findMany({
		where: { empresaId, timestamp: { gte: refDayStart, lte: refDayEnd }, type: 'entrada' },
		orderBy: { timestamp: 'asc' }
	});
	const entradaByUser = new Map(registrosDia.map((p) => [p.colaboradorId, p]));

	const dowKey = diaKeyFromDate(refDate);
	const entradasHoje = colaboradores
		.filter((c) => c.status === 'ativo')
		.map((c) => {
			const dias = (c.jornada?.dias ?? null) as JornadaDias | null;
			const cfg = dias ? dias[dowKey] : null;

			if (!c.jornada || !dias) {
				return {
					colaboradorId: c.id,
					nome: c.name,
					jornadaEntrada: null,
					batidaEntrada: entradaByUser.get(c.id)?.timestamp.toISOString() ?? null,
					atrasoMin: 0,
					status: 'sem_jornada' as const
				};
			}

			if (!cfg?.ativo) {
				return {
					colaboradorId: c.id,
					nome: c.name,
					jornadaEntrada: null,
					batidaEntrada: entradaByUser.get(c.id)?.timestamp.toISOString() ?? null,
					atrasoMin: 0,
					status: 'folga' as const
				};
			}

			const registro = entradaByUser.get(c.id);
			const previsto = cfg.entrada;
			const previstoMin = timeStringToMinutes(previsto);

			if (!registro) {
				// Sem batida: se ainda não passou da hora prevista no dia atual, marcar como pendente.
				const agora = new Date();
				const ehHoje = refKey === dateKey(agora);
				const agoraMin = ehHoje ? agora.getHours() * 60 + agora.getMinutes() : 24 * 60;
				const aindaNaoBateu = previstoMin !== null && agoraMin < previstoMin;
				return {
					colaboradorId: c.id,
					nome: c.name,
					jornadaEntrada: previsto,
					batidaEntrada: null,
					atrasoMin: 0,
					status: aindaNaoBateu ? ('pendente' as const) : ('falta' as const)
				};
			}

			// Tem batida: calcula atraso em minutos relativo ao horário previsto local (UTC-3)
			const isoPrevisto = new Date(`${refKey}T${previsto}:00-03:00`);
			const atrasoMin = Math.round((registro.timestamp.getTime() - isoPrevisto.getTime()) / 60_000);
			const atrasado = atrasoMin > TOLERANCIA_ATRASO_MIN;

			return {
				colaboradorId: c.id,
				nome: c.name,
				jornadaEntrada: previsto,
				batidaEntrada: registro.timestamp.toISOString(),
				atrasoMin,
				status: atrasado ? ('atrasado' as const) : ('pontual' as const)
			};
		})
		.sort((a, b) => {
			const ordem = { atrasado: 0, falta: 1, pendente: 2, pontual: 3, folga: 4, sem_jornada: 5 };
			return ordem[a.status] - ordem[b.status] || a.nome.localeCompare(b.nome);
		});

	const atrasosHoje = entradasHoje.filter((e) => e.status === 'atrasado').length;
	const faltasHoje = entradasHoje.filter((e) => e.status === 'falta').length;

	// ── Justificativas e férias ativas no mês ─────────────────────────────────
	const [justificativasMes, feriasAtivasNoMes] = await Promise.all([
		prisma.justificativa.count({
			where: { empresaId, data: { gte: mesStart, lte: mesEnd } }
		}),
		prisma.ferias.count({
			where: {
				empresaId,
				dataInicio: { lte: mesEnd },
				dataFim: { gte: mesStart }
			}
		})
	]);

	return jsonOk({
		referenciaData: refKey,
		colaboradoresAtivos,
		totalColaboradores,
		totalColaboradoresRegistrados: totalColaboradores,
		pontosHoje,
		atrasosHoje,
		faltasHoje,
		justificativasMes,
		feriasAtivasNoMes,
		horasExtrasMes: Number(horasExtrasMes.toFixed(1)),
		horasDeficitMes: Number(horasDeficitMes.toFixed(1)),
		horasExtrasPorDia,
		topExtras,
		entradasHoje
	});
};
