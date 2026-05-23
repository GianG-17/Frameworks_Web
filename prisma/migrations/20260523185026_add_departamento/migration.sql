-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Departamento_empresaId_idx" ON "Departamento"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_empresaId_nome_key" ON "Departamento"("empresaId", "nome");

-- AddForeignKey
ALTER TABLE "Departamento" ADD CONSTRAINT "Departamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: adiciona FK antes de remover a string antiga
ALTER TABLE "User" ADD COLUMN "departamentoId" TEXT;

-- Data migration: cria um Departamento para cada (empresaId, departamento) distinto
INSERT INTO "Departamento" ("id", "empresaId", "nome", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "empresaId",
    TRIM("departamento"),
    NOW(),
    NOW()
FROM "User"
WHERE "departamento" IS NOT NULL AND TRIM("departamento") <> ''
GROUP BY "empresaId", TRIM("departamento");

-- Liga User.departamentoId aos Departamentos recém-criados
UPDATE "User" u
SET "departamentoId" = d."id"
FROM "Departamento" d
WHERE d."empresaId" = u."empresaId"
  AND d."nome" = TRIM(u."departamento");

-- AlterTable: remove a coluna string antiga
ALTER TABLE "User" DROP COLUMN "departamento";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
