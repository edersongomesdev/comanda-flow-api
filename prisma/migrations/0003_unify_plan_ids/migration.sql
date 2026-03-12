-- CreateEnum
CREATE TYPE "PlanId_new" AS ENUM ('START', 'ESSENCIAL', 'MESA', 'PREMIUM');

-- Migrate existing tenants to the new canonical plan set.
ALTER TABLE "Tenant"
ALTER COLUMN "planId" TYPE "PlanId_new"
USING (
  CASE "planId"::text
    WHEN 'START' THEN 'START'
    WHEN 'MESA' THEN 'MESA'
    WHEN 'PRO' THEN 'PREMIUM'
    WHEN 'ELITE' THEN 'PREMIUM'
    ELSE 'START'
  END
)::"PlanId_new";

-- Replace old enum with the new canonical one.
DROP TYPE "PlanId";
ALTER TYPE "PlanId_new" RENAME TO "PlanId";
