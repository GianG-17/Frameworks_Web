import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateSecret } from 'otplib';
import process from 'process';

const prisma = new PrismaClient();

// ── Jornadas ─────────────────────────────────────────────────────────────────
const jornadaComercial = {
	segunda: {
		ativo: true,
		entrada: '08:00',
		saida_almoco: '12:00',
		retorno_almoco: '13:00',
		saida: '17:00'
	},
	terca: {
		ativo: true,
		entrada: '08:00',
		saida_almoco: '12:00',
		retorno_almoco: '13:00',
		saida: '17:00'
	},
	quarta: {
		ativo: true,
		entrada: '08:00',
		saida_almoco: '12:00',
		retorno_almoco: '13:00',
		saida: '17:00'
	},
	quinta: {
		ativo: true,
		entrada: '08:00',
		saida_almoco: '12:00',
		retorno_almoco: '13:00',
		saida: '17:00'
	},
	sexta: {
		ativo: true,
		entrada: '08:00',
		saida_almoco: '12:00',
		retorno_almoco: '13:00',
		saida: '17:00'
	},
	sabado: { ativo: false, entrada: '', saida_almoco: '', retorno_almoco: '', saida: '' },
	domingo: { ativo: false, entrada: '', saida_almoco: '', retorno_almoco: '', saida: '' }
};

const jornadaMeioPeriodo = {
	segunda: {
		ativo: true,
		entrada: '08:00',
		saida_almoco: '10:00',
		retorno_almoco: '10:15',
		saida: '12:00'
	},
	terca: {
		ativo: true,
		entrada: '08:00',
		saida_almoco: '10:00',
		retorno_almoco: '10:15',
		saida: '12:00'
	},
	quarta: {
		ativo: true,
		entrada: '08:00',
		saida_almoco: '10:00',
		retorno_almoco: '10:15',
		saida: '12:00'
	},
	quinta: {
		ativo: true,
		entrada: '08:00',
		saida_almoco: '10:00',
		retorno_almoco: '10:15',
		saida: '12:00'
	},
	sexta: {
		ativo: true,
		entrada: '08:00',
		saida_almoco: '10:00',
		retorno_almoco: '10:15',
		saida: '12:00'
	},
	sabado: { ativo: false, entrada: '', saida_almoco: '', retorno_almoco: '', saida: '' },
	domingo: { ativo: false, entrada: '', saida_almoco: '', retorno_almoco: '', saida: '' }
};

type DiaConfig = typeof jornadaComercial;

// ── PRNG determinístico (LCG) ────────────────────────────────────────────────
// Garante seed reprodutível: rodar `db:seed` sempre gera os mesmos timestamps.
function makeRng(seed: number) {
	let state = seed >>> 0;
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 0x100000000;
	};
}

function randInt(rng: () => number, min: number, max: number): number {
	return Math.floor(rng() * (max - min + 1)) + min;
}

function chance(rng: () => number, prob: number): boolean {
	return rng() < prob;
}

// ── Helpers de data ──────────────────────────────────────────────────────────
const TZ_OFFSET = '-03:00'; // America/Sao_Paulo

function buildTimestamp(dateISO: string, timeHHMM: string, offsetMinutes = 0): Date {
	const [h, m] = timeHHMM.split(':').map(Number);
	const total = h * 60 + m + offsetMinutes;
	const hh = String(Math.floor(total / 60)).padStart(2, '0');
	const mm = String(total % 60).padStart(2, '0');
	return new Date(`${dateISO}T${hh}:${mm}:00${TZ_OFFSET}`);
}

function diaSemanaKey(date: Date): keyof DiaConfig {
	const idx = date.getUTCDay(); // 0=Dom, 1=Seg…
	return ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][
		idx
	] as keyof DiaConfig;
}

function* iterDates(year: number, month: number): Generator<{ iso: string; dow: keyof DiaConfig }> {
	// month: 1-12
	const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
	for (let d = 1; d <= last; d++) {
		const date = new Date(Date.UTC(year, month - 1, d));
		yield {
			iso: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
			dow: diaSemanaKey(date)
		};
	}
}

// ── Geração de pontos de um dia ──────────────────────────────────────────────
type PunchType = 'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida';

interface PunchSpec {
	type: PunchType;
	timestamp: Date;
	method: 'qrcode' | 'manual';
}

interface DayBehavior {
	/** Probabilidade de o colaborador faltar (sem justificativa) */
	faltaProb: number;
	/** Probabilidade de chegar bem atrasado (>30min) */
	atrasoGraveProb: number;
	/** Probabilidade de esquecer alguma batida (1 batida faltando) */
	esqueceBatidaProb: number;
}

function gerarPontosDoDia(
	rng: () => number,
	dateISO: string,
	diaConfig: DiaConfig[keyof DiaConfig],
	comportamento: DayBehavior
): PunchSpec[] {
	if (!diaConfig.ativo) return [];
	if (chance(rng, comportamento.faltaProb)) return [];

	const planejado: { type: PunchType; horario: string }[] = [
		{ type: 'entrada', horario: diaConfig.entrada },
		{ type: 'saida_almoco', horario: diaConfig.saida_almoco },
		{ type: 'retorno_almoco', horario: diaConfig.retorno_almoco },
		{ type: 'saida', horario: diaConfig.saida }
	];

	// Atraso grave concentrado na entrada, "puxa" o dia
	const atrasoGrave = chance(rng, comportamento.atrasoGraveProb);

	const pontos: PunchSpec[] = planejado.map((p, i) => {
		let offset: number;
		if (i === 0 && atrasoGrave) {
			offset = randInt(rng, 30, 65);
		} else if (p.type === 'saida') {
			// Saída tende a ser pontual ou um pouco depois (hora extra leve às vezes)
			offset = randInt(rng, -5, 15);
		} else if (p.type === 'saida_almoco') {
			offset = randInt(rng, -5, 10);
		} else if (p.type === 'retorno_almoco') {
			// Volta do almoço atrasa um pouco mais
			offset = randInt(rng, -3, 12);
		} else {
			offset = randInt(rng, -8, 10);
		}
		return {
			type: p.type,
			timestamp: buildTimestamp(dateISO, p.horario, offset),
			method: chance(rng, 0.7) ? 'qrcode' : 'manual'
		};
	});

	// Eventualmente esquece uma batida (não a entrada — fica menos visível assim)
	if (chance(rng, comportamento.esqueceBatidaProb)) {
		const idxDrop = randInt(rng, 1, 3);
		pontos.splice(idxDrop, 1);
	}

	return pontos;
}

// ── Definição dos colaboradores ──────────────────────────────────────────────
interface ColaboradorSeed {
	name: string;
	email: string;
	cpf: string;
	cargo: string;
	departamento: string;
	telefone?: string;
	dataAdmissao: string;
	status: 'ativo' | 'inativo' | 'ferias' | 'afastado';
	jornada: 'comercial' | 'meioPeriodo';
	rngSeed: number;
	comportamento: DayBehavior;
	/** Período de férias dentro de Jan/2026 (opcional) */
	feriasJaneiro?: { inicio: string; fim: string };
	/** Faltas justificadas (datas dentro de Jan/2026) */
	justificativas?: { data: string; motivo: string }[];
}

const colaboradoresSeed: ColaboradorSeed[] = [
	{
		name: 'Carlos Souza',
		email: 'carlos@teste.com',
		cpf: '111.444.777-35',
		cargo: 'Desenvolvedor',
		departamento: 'Tecnologia',
		telefone: '11987654321',
		dataAdmissao: '2024-01-15',
		status: 'ativo',
		jornada: 'comercial',
		rngSeed: 101,
		comportamento: { faltaProb: 0.0, atrasoGraveProb: 0.05, esqueceBatidaProb: 0.04 }
	},
	{
		name: 'Ana Pereira',
		email: 'ana@teste.com',
		cpf: '222.555.888-46',
		cargo: 'Analista Financeiro',
		departamento: 'Financeiro',
		telefone: '11912345678',
		dataAdmissao: '2023-06-01',
		status: 'ativo',
		jornada: 'meioPeriodo',
		rngSeed: 202,
		comportamento: { faltaProb: 0.0, atrasoGraveProb: 0.02, esqueceBatidaProb: 0.06 }
	},
	{
		name: 'Bruno Oliveira',
		email: 'bruno@teste.com',
		cpf: '333.666.999-57',
		cargo: 'Designer',
		departamento: 'Marketing',
		telefone: '11955554444',
		dataAdmissao: '2024-03-10',
		status: 'ativo',
		jornada: 'comercial',
		rngSeed: 303,
		comportamento: { faltaProb: 0.0, atrasoGraveProb: 0.1, esqueceBatidaProb: 0.05 },
		justificativas: [{ data: '2026-01-22', motivo: 'Consulta médica' }]
	},
	{
		name: 'Daniela Martins',
		email: 'daniela@teste.com',
		cpf: '444.777.000-68',
		cargo: 'Coordenadora',
		departamento: 'RH',
		telefone: '11933332222',
		dataAdmissao: '2022-11-20',
		status: 'ativo',
		jornada: 'comercial',
		rngSeed: 404,
		comportamento: { faltaProb: 0.0, atrasoGraveProb: 0.03, esqueceBatidaProb: 0.02 }
	},
	{
		name: 'Eduardo Lima',
		email: 'eduardo@teste.com',
		cpf: '555.888.111-79',
		cargo: 'Suporte Técnico',
		departamento: 'Tecnologia',
		telefone: '11944443333',
		dataAdmissao: '2025-02-05',
		status: 'ativo',
		jornada: 'comercial',
		rngSeed: 505,
		comportamento: { faltaProb: 0.0, atrasoGraveProb: 0.07, esqueceBatidaProb: 0.08 },
		feriasJaneiro: { inicio: '2026-01-26', fim: '2026-01-30' }
	},
	{
		name: 'Fernanda Costa',
		email: 'fernanda@teste.com',
		cpf: '666.999.222-80',
		cargo: 'Estagiária',
		departamento: 'Marketing',
		telefone: '11922221111',
		dataAdmissao: '2025-08-12',
		status: 'ativo',
		jornada: 'meioPeriodo',
		rngSeed: 606,
		comportamento: { faltaProb: 0.0, atrasoGraveProb: 0.04, esqueceBatidaProb: 0.05 },
		justificativas: [{ data: '2026-01-09', motivo: 'Atestado odontológico' }]
	}
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
	const senhaHash = await bcrypt.hash('Senha123', 10);

	await prisma.justificativa.deleteMany();
	await prisma.ferias.deleteMany();
	await prisma.punch.deleteMany();
	await prisma.user.deleteMany();
	await prisma.jornada.deleteMany();
	await prisma.empresa.deleteMany();

	const empresa = await prisma.empresa.create({
		data: {
			nome: 'Empresa Demo',
			cnpj: '00.000.000/0001-00',
			horaAbertura: '08:00',
			horaFechamento: '18:00',
			qrSecret: generateSecret()
		}
	});

	const comercial = await prisma.jornada.create({
		data: { empresaId: empresa.id, nome: 'Comercial 8h', dias: JSON.stringify(jornadaComercial) }
	});
	const meioPeriodo = await prisma.jornada.create({
		data: {
			empresaId: empresa.id,
			nome: 'Meio Período Manhã',
			dias: JSON.stringify(jornadaMeioPeriodo)
		}
	});

	await prisma.user.create({
		data: {
			empresaId: empresa.id,
			name: 'Admin',
			email: 'admin@teste.com',
			cpf: '123.456.789-00',
			password: senhaHash,
			role: 'admin'
		}
	});

	const jornadasMap = {
		comercial: { id: comercial.id, dias: jornadaComercial },
		meioPeriodo: { id: meioPeriodo.id, dias: jornadaMeioPeriodo }
	};

	let totalPunches = 0;

	for (const c of colaboradoresSeed) {
		const jornada = jornadasMap[c.jornada];

		const user = await prisma.user.create({
			data: {
				empresaId: empresa.id,
				name: c.name,
				email: c.email,
				cpf: c.cpf,
				password: senhaHash,
				role: 'colaborador',
				cargo: c.cargo,
				departamento: c.departamento,
				telefone: c.telefone,
				dataAdmissao: new Date(c.dataAdmissao),
				status: c.status,
				jornadaId: jornada.id
			}
		});

		if (c.feriasJaneiro) {
			await prisma.ferias.create({
				data: {
					empresaId: empresa.id,
					colaboradorId: user.id,
					dataInicio: new Date(c.feriasJaneiro.inicio),
					dataFim: new Date(c.feriasJaneiro.fim),
					observacao: 'Férias programadas'
				}
			});
		}

		if (c.justificativas) {
			for (const j of c.justificativas) {
				await prisma.justificativa.create({
					data: {
						empresaId: empresa.id,
						colaboradorId: user.id,
						data: new Date(j.data),
						motivo: j.motivo
					}
				});
			}
		}

		const rng = makeRng(c.rngSeed);
		const feriasSet = new Set<string>();
		if (c.feriasJaneiro) {
			const ini = new Date(c.feriasJaneiro.inicio);
			const fim = new Date(c.feriasJaneiro.fim);
			for (let d = new Date(ini); d <= fim; d.setUTCDate(d.getUTCDate() + 1)) {
				feriasSet.add(d.toISOString().slice(0, 10));
			}
		}
		const justSet = new Set((c.justificativas ?? []).map((j) => j.data));

		const punchesData: {
			userId: string;
			empresaId: string;
			type: PunchType;
			timestamp: Date;
			method: 'qrcode' | 'manual';
		}[] = [];

		for (const { iso, dow } of iterDates(2026, 1)) {
			if (feriasSet.has(iso) || justSet.has(iso)) continue;
			const diaConfig = jornada.dias[dow];
			const pontos = gerarPontosDoDia(rng, iso, diaConfig, c.comportamento);
			for (const p of pontos) {
				punchesData.push({
					userId: user.id,
					empresaId: empresa.id,
					type: p.type,
					timestamp: p.timestamp,
					method: p.method
				});
			}
		}

		if (punchesData.length > 0) {
			await prisma.punch.createMany({ data: punchesData });
			totalPunches += punchesData.length;
		}
	}

	console.log(
		`✓ Seed concluído: 1 empresa, 2 jornadas, 1 admin, ${colaboradoresSeed.length} colaboradores, ${totalPunches} pontos em Jan/2026.`
	);
	console.log(`  Senha padrão para todos: Senha123`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
