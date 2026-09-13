CREATE TABLE "demo_leads" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "company" TEXT,
  "consentAt" TIMESTAMP(3) NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'landing',
  "status" TEXT NOT NULL DEFAULT 'new',
  "ipHash" TEXT,
  "retentionUntil" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "demo_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "demo_leads_createdAt_idx" ON "demo_leads"("createdAt");
CREATE INDEX "demo_leads_retentionUntil_idx" ON "demo_leads"("retentionUntil");
