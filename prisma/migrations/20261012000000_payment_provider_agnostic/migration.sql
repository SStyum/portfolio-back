-- Renomeia colunas específicas da Stripe para nomes genéricos (preserva os dados)
ALTER TABLE "payments" RENAME COLUMN "stripePaymentIntentId" TO "externalId";
ALTER TABLE "payments" RENAME COLUMN "stripeCustomerId" TO "externalCustomerId";

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "externalId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_externalId_key" ON "payments"("provider", "externalId");
