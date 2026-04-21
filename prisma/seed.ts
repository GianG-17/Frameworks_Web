import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';

const prisma = new PrismaClient();

const jornadaComercial = {
  segunda:  { ativo: true,  entrada: '08:00', saida_almoco: '12:00', retorno_almoco: '13:00', saida: '17:00' },
  terca:    { ativo: true,  entrada: '08:00', saida_almoco: '12:00', retorno_almoco: '13:00', saida: '17:00' },
  quarta:   { ativo: true,  entrada: '08:00', saida_almoco: '12:00', retorno_almoco: '13:00', saida: '17:00' },
  quinta:   { ativo: true,  entrada: '08:00', saida_almoco: '12:00', retorno_almoco: '13:00', saida: '17:00' },
  sexta:    { ativo: true,  entrada: '08:00', saida_almoco: '12:00', retorno_almoco: '13:00', saida: '17:00' },
  sabado:   { ativo: false, entrada: '',      saida_almoco: '',      retorno_almoco: '',      saida: ''      },
  domingo:  { ativo: false, entrada: '',      saida_almoco: '',      retorno_almoco: '',      saida: ''      }
};

const jornadaMeioPeriodo = {
  segunda:  { ativo: true,  entrada: '08:00', saida_almoco: '10:00', retorno_almoco: '10:15', saida: '12:00' },
  terca:    { ativo: true,  entrada: '08:00', saida_almoco: '10:00', retorno_almoco: '10:15', saida: '12:00' },
  quarta:   { ativo: true,  entrada: '08:00', saida_almoco: '10:00', retorno_almoco: '10:15', saida: '12:00' },
  quinta:   { ativo: true,  entrada: '08:00', saida_almoco: '10:00', retorno_almoco: '10:15', saida: '12:00' },
  sexta:    { ativo: true,  entrada: '08:00', saida_almoco: '10:00', retorno_almoco: '10:15', saida: '12:00' },
  sabado:   { ativo: false, entrada: '',      saida_almoco: '',      retorno_almoco: '',      saida: ''      },
  domingo:  { ativo: false, entrada: '',      saida_almoco: '',      retorno_almoco: '',      saida: ''      }
};

async function main() {
  const senhaHash = await bcrypt.hash('Senha123', 10);

  // Limpa dados em ordem segura (respeitando FKs)
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
      qrSecret: authenticator.generateSecret()
    }
  });

  const comercial = await prisma.jornada.create({
    data: {
      empresaId: empresa.id,
      nome: 'Comercial 8h',
      dias: JSON.stringify(jornadaComercial)
    }
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

  await prisma.user.create({
    data: {
      empresaId: empresa.id,
      name: 'Carlos Souza',
      email: 'carlos@teste.com',
      cpf: '111.444.777-35',
      password: senhaHash,
      role: 'colaborador',
      cargo: 'Desenvolvedor',
      departamento: 'Tecnologia',
      dataAdmissao: new Date('2024-01-15'),
      status: 'ativo',
      jornadaId: comercial.id
    }
  });

  await prisma.user.create({
    data: {
      empresaId: empresa.id,
      name: 'Ana Pereira',
      email: 'ana@teste.com',
      cpf: '222.555.888-46',
      password: senhaHash,
      role: 'colaborador',
      cargo: 'Analista',
      departamento: 'Financeiro',
      dataAdmissao: new Date('2023-06-01'),
      status: 'ativo',
      jornadaId: meioPeriodo.id
    }
  });

  console.log('✓ Seed concluído: 1 empresa, 2 jornadas, 1 admin, 2 colaboradores. Senha padrão: Senha123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
