-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_profiles_tenant_id_idx" ON "user_profiles"("tenant_id");

-- AddForeignKey
ALTER TABLE "user_profiles"
ADD CONSTRAINT "user_profiles_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles"
ADD CONSTRAINT "user_profiles_id_fkey"
FOREIGN KEY ("id") REFERENCES auth.users("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
