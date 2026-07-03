-- DropForeignKey
ALTER TABLE "registros" DROP CONSTRAINT "registros_colaboradorId_fkey";

-- AlterTable
ALTER TABLE "colaboradores" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "colaboradores_empresaId_deletedAt_idx" ON "colaboradores"("empresaId", "deletedAt");

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
