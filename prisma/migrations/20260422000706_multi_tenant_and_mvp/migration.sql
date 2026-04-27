/*
  Warnings:

  - Added the required column `empresaId` to the `Jornada` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `Punch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "horaAbertura" TEXT NOT NULL,
    "horaFechamento" TEXT NOT NULL,
    "qrSecret" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Ferias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "colaboradorId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME NOT NULL,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ferias_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ferias_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Justificativa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "colaboradorId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "motivo" TEXT NOT NULL,
    "anexoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Justificativa_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Justificativa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Jornada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dias" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Jornada_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Jornada" ("createdAt", "dias", "id", "nome", "updatedAt") SELECT "createdAt", "dias", "id", "nome", "updatedAt" FROM "Jornada";
DROP TABLE "Jornada";
ALTER TABLE "new_Jornada" RENAME TO "Jornada";
CREATE INDEX "Jornada_empresaId_idx" ON "Jornada"("empresaId");
CREATE TABLE "new_Punch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    CONSTRAINT "Punch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Punch_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Punch" ("id", "latitude", "longitude", "method", "timestamp", "type", "userId") SELECT "id", "latitude", "longitude", "method", "timestamp", "type", "userId" FROM "Punch";
DROP TABLE "Punch";
ALTER TABLE "new_Punch" RENAME TO "Punch";
CREATE INDEX "Punch_userId_timestamp_idx" ON "Punch"("userId", "timestamp");
CREATE INDEX "Punch_empresaId_timestamp_idx" ON "Punch"("empresaId", "timestamp");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "cargo" TEXT,
    "departamento" TEXT,
    "telefone" TEXT,
    "dataAdmissao" DATETIME,
    "status" TEXT,
    "jornadaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "User_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "Jornada" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("cargo", "cpf", "createdAt", "dataAdmissao", "departamento", "email", "id", "jornadaId", "name", "password", "role", "status", "telefone", "updatedAt") SELECT "cargo", "cpf", "createdAt", "dataAdmissao", "departamento", "email", "id", "jornadaId", "name", "password", "role", "status", "telefone", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");
CREATE INDEX "User_empresaId_idx" ON "User"("empresaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- CreateIndex
CREATE INDEX "Ferias_empresaId_idx" ON "Ferias"("empresaId");

-- CreateIndex
CREATE INDEX "Ferias_colaboradorId_idx" ON "Ferias"("colaboradorId");

-- CreateIndex
CREATE INDEX "Justificativa_empresaId_idx" ON "Justificativa"("empresaId");

-- CreateIndex
CREATE INDEX "Justificativa_colaboradorId_idx" ON "Justificativa"("colaboradorId");
