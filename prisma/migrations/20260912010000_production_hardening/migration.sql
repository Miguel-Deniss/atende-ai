-- DropIndex
DROP INDEX "api_keys_key_idx";

-- DropIndex
DROP INDEX "api_keys_key_key";

-- Migrate existing API keys without retaining their plaintext value.
ALTER TABLE "api_keys"
ADD COLUMN "keyHash" TEXT,
ADD COLUMN "keyPrefix" TEXT;

UPDATE "api_keys"
SET "keyHash" = encode(sha256(convert_to("key", 'UTF8')), 'hex'),
    "keyPrefix" = left("key", 12);

ALTER TABLE "api_keys"
ALTER COLUMN "keyHash" SET NOT NULL,
ALTER COLUMN "keyPrefix" SET NOT NULL,
DROP COLUMN "key";

-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "webhook_events" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_keyPrefix_idx" ON "api_keys"("keyPrefix");

-- CreateIndex
CREATE INDEX "appointments_clientId_idx" ON "appointments"("clientId");

-- CreateIndex
CREATE INDEX "billing_history_subscriptionId_idx" ON "billing_history"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_companyId_phone_key" ON "clients"("companyId", "phone");

-- Prevent concurrent active bookings for the same company slot while allowing
-- a soft-deleted appointment to release the slot.
CREATE UNIQUE INDEX "appointments_active_slot_key"
ON "appointments"("companyId", "date", "time")
WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "conversations_clientId_idx" ON "conversations"("clientId");

-- CreateIndex
CREATE INDEX "login_attempts_userId_idx" ON "login_attempts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "messages_externalId_key" ON "messages"("externalId");

-- CreateIndex
CREATE INDEX "subscriptions_couponId_idx" ON "subscriptions"("couponId");

-- CreateIndex
CREATE INDEX "uploads_uploadedById_idx" ON "uploads"("uploadedById");

-- CreateIndex
CREATE INDEX "webhook_events_status_availableAt_idx" ON "webhook_events"("status", "availableAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_externalId_key" ON "webhook_events"("provider", "externalId");
