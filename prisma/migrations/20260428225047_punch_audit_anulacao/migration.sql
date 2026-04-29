-- AlterTable
ALTER TABLE "Punch" ADD COLUMN "createdBy" TEXT;
ALTER TABLE "Punch" ADD COLUMN "createdReason" TEXT;

-- CreateTable
CREATE TABLE "PunchAnulacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "punchId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "anuladoPor" TEXT NOT NULL,
    "anuladoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PunchAnulacao_punchId_fkey" FOREIGN KEY ("punchId") REFERENCES "Punch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PunchAnulacao_punchId_key" ON "PunchAnulacao"("punchId");

-- CreateIndex
CREATE INDEX "PunchAnulacao_empresaId_idx" ON "PunchAnulacao"("empresaId");
