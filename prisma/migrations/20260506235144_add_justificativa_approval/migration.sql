-- AlterTable
ALTER TABLE "Justificativa" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "Justificativa_status_idx" ON "Justificativa"("status");
