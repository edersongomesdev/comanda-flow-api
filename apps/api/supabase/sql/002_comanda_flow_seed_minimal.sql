-- Comanda Flow
-- Generated from prisma/seed-data.ts to match prisma/seed.ts.
-- Owner login: carlos@generalburguer.com / demo123

BEGIN;

INSERT INTO "Tenant" (
    "id",
    "slug",
    "name",
    "address",
    "city",
    "phone",
    "whatsapp",
    "hours",
    "logoUrl",
    "planId",
    "trialEndsAt",
    "maxTables",
    "deliveryAreas",
    "paymentMethods",
    "updatedAt"
)
VALUES (
    'clseedtenantgeneral000000001',
    'general-burguer',
    'General Burguer',
    'Rua das Hamburguerias, 42',
    'Sao Paulo',
    '11999998888',
    '5511999998888',
    'Seg-Sab 11h-23h',
    NULL,
    'MESA'::"PlanId",
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    15,
    ARRAY['Centro', 'Jardins', 'Pinheiros']::TEXT[],
    ARRAY['Pix', 'Credito', 'Debito']::TEXT[],
    CURRENT_TIMESTAMP
)
ON CONFLICT ("slug")
DO UPDATE SET
    "name" = EXCLUDED."name",
    "address" = EXCLUDED."address",
    "city" = EXCLUDED."city",
    "phone" = EXCLUDED."phone",
    "whatsapp" = EXCLUDED."whatsapp",
    "hours" = EXCLUDED."hours",
    "logoUrl" = EXCLUDED."logoUrl",
    "planId" = EXCLUDED."planId",
    "trialEndsAt" = EXCLUDED."trialEndsAt",
    "maxTables" = EXCLUDED."maxTables",
    "deliveryAreas" = EXCLUDED."deliveryAreas",
    "paymentMethods" = EXCLUDED."paymentMethods",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "User" (
    "id",
    "tenantId",
    "name",
    "email",
    "passwordHash",
    "role",
    "updatedAt"
)
SELECT
    'clseedusercarlos0000000001',
    "id",
    'Carlos Silva',
    'carlos@generalburguer.com',
    '$2a$10$hpv/UmNB4T4EfuQjO93Ml.zOdFqQ9fzJ0lO7o7b6zerzgiffJ2HPi',
    'OWNER'::"UserRole",
    CURRENT_TIMESTAMP
FROM "Tenant"
WHERE "slug" = 'general-burguer'
ON CONFLICT ("email")
DO UPDATE SET
    "tenantId" = EXCLUDED."tenantId",
    "name" = EXCLUDED."name",
    "passwordHash" = EXCLUDED."passwordHash",
    "role" = EXCLUDED."role",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Subscription" (
    "id",
    "tenantId",
    "stripeCustomerId",
    "stripeSubscriptionId",
    "stripePriceId",
    "status",
    "currentPeriodEnd",
    "updatedAt"
)
SELECT
    'clseedsubscription000000001',
    "id",
    NULL,
    NULL,
    NULL,
    'TRIALING'::"SubscriptionStatus",
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    CURRENT_TIMESTAMP
FROM "Tenant"
WHERE "slug" = 'general-burguer'
ON CONFLICT ("tenantId")
DO UPDATE SET
    "stripeCustomerId" = EXCLUDED."stripeCustomerId",
    "stripeSubscriptionId" = EXCLUDED."stripeSubscriptionId",
    "stripePriceId" = EXCLUDED."stripePriceId",
    "status" = EXCLUDED."status",
    "currentPeriodEnd" = EXCLUDED."currentPeriodEnd",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Category" (
    "id",
    "tenantId",
    "name",
    "icon",
    "sortOrder",
    "updatedAt"
)
SELECT
    seeded."id",
    tenant."id",
    seeded."name",
    seeded."icon",
    seeded."sortOrder",
    CURRENT_TIMESTAMP
FROM "Tenant" AS tenant
CROSS JOIN (
    VALUES
        ('clseedcategoryburgers000001', 'Burgers', 'burger', 1),
        ('clseedcategorysides000000001', 'Acompanhamentos', 'utensils', 2),
        ('clseedcategorydrinks00000001', 'Bebidas', 'cup-soda', 3)
) AS seeded("id", "name", "icon", "sortOrder")
WHERE tenant."slug" = 'general-burguer'
ON CONFLICT ("id")
DO UPDATE SET
    "tenantId" = EXCLUDED."tenantId",
    "name" = EXCLUDED."name",
    "icon" = EXCLUDED."icon",
    "sortOrder" = EXCLUDED."sortOrder",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "ModifierGroup" (
    "id",
    "tenantId",
    "name",
    "description",
    "isRequired",
    "minSelections",
    "maxSelections",
    "sortOrder",
    "updatedAt"
)
SELECT
    'clseedmodifiergroup000000001',
    "id",
    'Adicionais',
    NULL,
    FALSE,
    0,
    3,
    0,
    CURRENT_TIMESTAMP
FROM "Tenant"
WHERE "slug" = 'general-burguer'
ON CONFLICT ("id")
DO UPDATE SET
    "tenantId" = EXCLUDED."tenantId",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "isRequired" = EXCLUDED."isRequired",
    "minSelections" = EXCLUDED."minSelections",
    "maxSelections" = EXCLUDED."maxSelections",
    "sortOrder" = EXCLUDED."sortOrder",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "ModifierOption" (
    "id",
    "modifierGroupId",
    "name",
    "priceCents",
    "sortOrder",
    "isActive",
    "updatedAt"
)
VALUES
    (
        'clseedmodifieroption0000001',
        'clseedmodifiergroup000000001',
        'Bacon extra',
        500,
        0,
        TRUE,
        CURRENT_TIMESTAMP
    ),
    (
        'clseedmodifieroption0000002',
        'clseedmodifiergroup000000001',
        'Cheddar extra',
        400,
        1,
        TRUE,
        CURRENT_TIMESTAMP
    ),
    (
        'clseedmodifieroption0000003',
        'clseedmodifiergroup000000001',
        'Ovo',
        300,
        2,
        TRUE,
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("id")
DO UPDATE SET
    "modifierGroupId" = EXCLUDED."modifierGroupId",
    "name" = EXCLUDED."name",
    "priceCents" = EXCLUDED."priceCents",
    "sortOrder" = EXCLUDED."sortOrder",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "MenuItem" (
    "id",
    "tenantId",
    "categoryId",
    "name",
    "description",
    "priceCents",
    "imageUrl",
    "isBestSeller",
    "isActive",
    "updatedAt"
)
SELECT
    'clseedmenuitemsmash00000001',
    tenant."id",
    'clseedcategoryburgers000001',
    'Smash Classico',
    'Dois smash burgers, cheddar e molho da casa.',
    3290,
    NULL,
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP
FROM "Tenant" AS tenant
WHERE tenant."slug" = 'general-burguer'
ON CONFLICT ("id")
DO UPDATE SET
    "tenantId" = EXCLUDED."tenantId",
    "categoryId" = EXCLUDED."categoryId",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "priceCents" = EXCLUDED."priceCents",
    "imageUrl" = EXCLUDED."imageUrl",
    "isBestSeller" = EXCLUDED."isBestSeller",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "MenuItem" (
    "id",
    "tenantId",
    "categoryId",
    "name",
    "description",
    "priceCents",
    "imageUrl",
    "isBestSeller",
    "isActive",
    "updatedAt"
)
SELECT
    'clseedmenuitemgeneral000001',
    tenant."id",
    'clseedcategoryburgers000001',
    'General Burguer',
    'Hamburguer artesanal com provolone e maionese trufada.',
    3990,
    NULL,
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP
FROM "Tenant" AS tenant
WHERE tenant."slug" = 'general-burguer'
ON CONFLICT ("id")
DO UPDATE SET
    "tenantId" = EXCLUDED."tenantId",
    "categoryId" = EXCLUDED."categoryId",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "priceCents" = EXCLUDED."priceCents",
    "imageUrl" = EXCLUDED."imageUrl",
    "isBestSeller" = EXCLUDED."isBestSeller",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "MenuItem" (
    "id",
    "tenantId",
    "categoryId",
    "name",
    "description",
    "priceCents",
    "imageUrl",
    "isBestSeller",
    "isActive",
    "updatedAt"
)
SELECT
    'clseedmenuitemsides00000001',
    tenant."id",
    'clseedcategorysides000000001',
    'Batata Rustica',
    'Batata rustica com ervas finas.',
    1890,
    NULL,
    FALSE,
    TRUE,
    CURRENT_TIMESTAMP
FROM "Tenant" AS tenant
WHERE tenant."slug" = 'general-burguer'
ON CONFLICT ("id")
DO UPDATE SET
    "tenantId" = EXCLUDED."tenantId",
    "categoryId" = EXCLUDED."categoryId",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "priceCents" = EXCLUDED."priceCents",
    "imageUrl" = EXCLUDED."imageUrl",
    "isBestSeller" = EXCLUDED."isBestSeller",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "MenuItem" (
    "id",
    "tenantId",
    "categoryId",
    "name",
    "description",
    "priceCents",
    "imageUrl",
    "isBestSeller",
    "isActive",
    "updatedAt"
)
SELECT
    'clseedmenuitemcoke00000001',
    tenant."id",
    'clseedcategorydrinks00000001',
    'Coca-Cola',
    'Lata 350ml',
    790,
    NULL,
    FALSE,
    TRUE,
    CURRENT_TIMESTAMP
FROM "Tenant" AS tenant
WHERE tenant."slug" = 'general-burguer'
ON CONFLICT ("id")
DO UPDATE SET
    "tenantId" = EXCLUDED."tenantId",
    "categoryId" = EXCLUDED."categoryId",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "priceCents" = EXCLUDED."priceCents",
    "imageUrl" = EXCLUDED."imageUrl",
    "isBestSeller" = EXCLUDED."isBestSeller",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "MenuItem" (
    "id",
    "tenantId",
    "categoryId",
    "name",
    "description",
    "priceCents",
    "imageUrl",
    "isBestSeller",
    "isActive",
    "updatedAt"
)
SELECT
    'clseedmenuitemjuice0000001',
    tenant."id",
    'clseedcategorydrinks00000001',
    'Suco Natural',
    'Laranja ou limao, 400ml.',
    1290,
    NULL,
    FALSE,
    TRUE,
    CURRENT_TIMESTAMP
FROM "Tenant" AS tenant
WHERE tenant."slug" = 'general-burguer'
ON CONFLICT ("id")
DO UPDATE SET
    "tenantId" = EXCLUDED."tenantId",
    "categoryId" = EXCLUDED."categoryId",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "priceCents" = EXCLUDED."priceCents",
    "imageUrl" = EXCLUDED."imageUrl",
    "isBestSeller" = EXCLUDED."isBestSeller",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "MenuItemModifierGroup" (
    "id",
    "menuItemId",
    "modifierGroupId",
    "sortOrder"
)
VALUES
(
    'clseeditemgroup000000000001',
    'clseedmenuitemsmash00000001',
    'clseedmodifiergroup000000001',
    0
)
ON CONFLICT ("menuItemId", "modifierGroupId")
DO UPDATE SET
    "sortOrder" = EXCLUDED."sortOrder";

INSERT INTO "Table" (
    "id",
    "tenantId",
    "number",
    "status",
    "updatedAt"
)
SELECT
    seeded."id",
    tenant."id",
    seeded."number",
    seeded."status",
    CURRENT_TIMESTAMP
FROM "Tenant" AS tenant
CROSS JOIN (
    VALUES
        ('clseedtable000000000000001', 1, 'AVAILABLE'::"TableStatus"),
        ('clseedtable000000000000002', 2, 'OCCUPIED'::"TableStatus")
) AS seeded("id", "number", "status")
WHERE tenant."slug" = 'general-burguer'
ON CONFLICT ("tenantId", "number")
DO UPDATE SET
    "status" = EXCLUDED."status",
    "updatedAt" = CURRENT_TIMESTAMP;

COMMIT;
