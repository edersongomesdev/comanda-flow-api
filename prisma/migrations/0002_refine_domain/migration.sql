-- CreateEnum
CREATE TYPE "PlanId" AS ENUM ('START', 'MESA', 'PRO', 'ELITE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "planId_v2" "PlanId" NOT NULL DEFAULT 'START';

-- BackfillTenantPlanId
UPDATE "Tenant"
SET "planId_v2" = CASE LOWER("planId")
    WHEN 'start' THEN 'START'::"PlanId"
    WHEN 'mesa' THEN 'MESA'::"PlanId"
    WHEN 'pro' THEN 'PRO'::"PlanId"
    WHEN 'elite' THEN 'ELITE'::"PlanId"
    WHEN 'premium' THEN 'ELITE'::"PlanId"
    WHEN 'essencial' THEN 'START'::"PlanId"
    ELSE 'START'::"PlanId"
END;

ALTER TABLE "Tenant" DROP COLUMN "planId";
ALTER TABLE "Tenant" RENAME COLUMN "planId_v2" TO "planId";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "status_v2" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE';

-- BackfillSubscriptionStatus
UPDATE "Subscription"
SET "status_v2" = CASE LOWER("status")
    WHEN 'trial' THEN 'TRIALING'::"SubscriptionStatus"
    WHEN 'trialing' THEN 'TRIALING'::"SubscriptionStatus"
    WHEN 'active' THEN 'ACTIVE'::"SubscriptionStatus"
    WHEN 'past_due' THEN 'PAST_DUE'::"SubscriptionStatus"
    WHEN 'canceled' THEN 'CANCELED'::"SubscriptionStatus"
    WHEN 'cancelled' THEN 'CANCELED'::"SubscriptionStatus"
    WHEN 'incomplete' THEN 'INCOMPLETE'::"SubscriptionStatus"
    ELSE 'INCOMPLETE'::"SubscriptionStatus"
END;

ALTER TABLE "Subscription" DROP COLUMN "status";
ALTER TABLE "Subscription" RENAME COLUMN "status_v2" TO "status";

-- CreateTable
CREATE TABLE "ModifierGroup" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "minSelections" INTEGER NOT NULL DEFAULT 0,
    "maxSelections" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModifierGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModifierOption" (
    "id" TEXT NOT NULL,
    "modifierGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModifierOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemModifierGroup" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "modifierGroupId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuItemModifierGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModifierGroup_tenantId_idx" ON "ModifierGroup"("tenantId");

-- CreateIndex
CREATE INDEX "ModifierOption_modifierGroupId_idx" ON "ModifierOption"("modifierGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemModifierGroup_menuItemId_modifierGroupId_key" ON "MenuItemModifierGroup"("menuItemId", "modifierGroupId");

-- CreateIndex
CREATE INDEX "MenuItemModifierGroup_menuItemId_idx" ON "MenuItemModifierGroup"("menuItemId");

-- CreateIndex
CREATE INDEX "MenuItemModifierGroup_modifierGroupId_idx" ON "MenuItemModifierGroup"("modifierGroupId");

-- AddForeignKey
ALTER TABLE "ModifierGroup" ADD CONSTRAINT "ModifierGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModifierOption" ADD CONSTRAINT "ModifierOption_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "ModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemModifierGroup" ADD CONSTRAINT "MenuItemModifierGroup_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemModifierGroup" ADD CONSTRAINT "MenuItemModifierGroup_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "ModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
