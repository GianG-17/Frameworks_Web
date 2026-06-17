-- AlterTable
ALTER TABLE "registro_anulacoes" ADD COLUMN     "registroSubstitutoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "registro_anulacoes_registroSubstitutoId_key" ON "registro_anulacoes"("registroSubstitutoId");

-- AddForeignKey
ALTER TABLE "registro_anulacoes" ADD CONSTRAINT "registro_anulacoes_registroSubstitutoId_fkey" FOREIGN KEY ("registroSubstitutoId") REFERENCES "registros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
