-- AlterTable
ALTER TABLE "jornadas" DROP COLUMN "dias";

-- CreateTable
CREATE TABLE "jornada_versoes" (
    "id" TEXT NOT NULL,
    "jornadaId" TEXT NOT NULL,
    "dias" JSONB NOT NULL,
    "vigenciaInicio" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jornada_versoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jornada_versoes_jornadaId_vigenciaInicio_idx" ON "jornada_versoes"("jornadaId", "vigenciaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "jornada_versoes_jornadaId_vigenciaInicio_key" ON "jornada_versoes"("jornadaId", "vigenciaInicio");

-- AddForeignKey
ALTER TABLE "jornada_versoes" ADD CONSTRAINT "jornada_versoes_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "jornadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
