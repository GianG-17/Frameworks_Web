/*
  Warnings:

  - You are about to drop the `Departamento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Empresa` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ferias` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Jornada` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Justificativa` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Punch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PunchAnulacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Departamento" DROP CONSTRAINT "Departamento_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Ferias" DROP CONSTRAINT "Ferias_colaboradorId_fkey";

-- DropForeignKey
ALTER TABLE "Ferias" DROP CONSTRAINT "Ferias_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Jornada" DROP CONSTRAINT "Jornada_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Justificativa" DROP CONSTRAINT "Justificativa_colaboradorId_fkey";

-- DropForeignKey
ALTER TABLE "Justificativa" DROP CONSTRAINT "Justificativa_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Punch" DROP CONSTRAINT "Punch_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Punch" DROP CONSTRAINT "Punch_userId_fkey";

-- DropForeignKey
ALTER TABLE "PunchAnulacao" DROP CONSTRAINT "PunchAnulacao_punchId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_departamentoId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_jornadaId_fkey";

-- DropTable
DROP TABLE "Departamento";

-- DropTable
DROP TABLE "Empresa";

-- DropTable
DROP TABLE "Ferias";

-- DropTable
DROP TABLE "Jornada";

-- DropTable
DROP TABLE "Justificativa";

-- DropTable
DROP TABLE "Punch";

-- DropTable
DROP TABLE "PunchAnulacao";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "horaAbertura" TEXT NOT NULL,
    "horaFechamento" TEXT NOT NULL,
    "qrSecret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colaboradores" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "cargo" TEXT,
    "departamentoId" TEXT,
    "telefone" TEXT,
    "dataAdmissao" TIMESTAMP(3),
    "status" TEXT,
    "jornadaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jornadas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jornadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdBy" TEXT,
    "createdReason" TEXT,

    CONSTRAINT "registros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_anulacoes" (
    "id" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "anuladoPor" TEXT NOT NULL,
    "anuladoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_anulacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ferias" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ferias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "justificativas" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "anexoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "justificativas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cpf_key" ON "usuarios"("cpf");

-- CreateIndex
CREATE INDEX "usuarios_empresaId_idx" ON "usuarios"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "colaboradores_email_key" ON "colaboradores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "colaboradores_cpf_key" ON "colaboradores"("cpf");

-- CreateIndex
CREATE INDEX "colaboradores_empresaId_idx" ON "colaboradores"("empresaId");

-- CreateIndex
CREATE INDEX "departamentos_empresaId_idx" ON "departamentos"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_empresaId_nome_key" ON "departamentos"("empresaId", "nome");

-- CreateIndex
CREATE INDEX "jornadas_empresaId_idx" ON "jornadas"("empresaId");

-- CreateIndex
CREATE INDEX "registros_colaboradorId_timestamp_idx" ON "registros"("colaboradorId", "timestamp");

-- CreateIndex
CREATE INDEX "registros_empresaId_timestamp_idx" ON "registros"("empresaId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "registro_anulacoes_registroId_key" ON "registro_anulacoes"("registroId");

-- CreateIndex
CREATE INDEX "registro_anulacoes_empresaId_idx" ON "registro_anulacoes"("empresaId");

-- CreateIndex
CREATE INDEX "ferias_empresaId_idx" ON "ferias"("empresaId");

-- CreateIndex
CREATE INDEX "ferias_colaboradorId_idx" ON "ferias"("colaboradorId");

-- CreateIndex
CREATE INDEX "justificativas_status_idx" ON "justificativas"("status");

-- CreateIndex
CREATE INDEX "justificativas_empresaId_idx" ON "justificativas"("empresaId");

-- CreateIndex
CREATE INDEX "justificativas_colaboradorId_idx" ON "justificativas"("colaboradorId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "jornadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jornadas" ADD CONSTRAINT "jornadas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "colaboradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_anulacoes" ADD CONSTRAINT "registro_anulacoes_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "registros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferias" ADD CONSTRAINT "ferias_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "colaboradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferias" ADD CONSTRAINT "ferias_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justificativas" ADD CONSTRAINT "justificativas_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "colaboradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justificativas" ADD CONSTRAINT "justificativas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
