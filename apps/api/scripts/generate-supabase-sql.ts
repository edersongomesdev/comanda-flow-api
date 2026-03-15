import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { demoSeed } from '../prisma/seed-data';

const rootDir = path.resolve(__dirname, '..');
const sqlDir = path.join(rootDir, 'supabase', 'sql');
const initSqlPath = path.join(sqlDir, '001_comanda_flow_init.sql');
const seedSqlPath = path.join(sqlDir, '002_comanda_flow_seed_minimal.sql');

function quoteSql(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function nullableSql(value: string | null): string {
  return value === null ? 'NULL' : quoteSql(value);
}

function textArraySql(values: readonly string[]): string {
  if (values.length === 0) {
    return 'ARRAY[]::TEXT[]';
  }

  return `ARRAY[${values.map((value) => quoteSql(value)).join(', ')}]::TEXT[]`;
}

function boolSql(value: boolean): string {
  return value ? 'TRUE' : 'FALSE';
}

function enumSql(value: string, enumName: string): string {
  return `${quoteSql(value)}::"${enumName}"`;
}

function generateInitSql(): string {
  const prismaCliEntrypoint = require.resolve('prisma/build/index.js', {
    paths: [rootDir],
  });
  const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');
  const diffOutput = execFileSync(
    process.execPath,
    [
      prismaCliEntrypoint,
      'migrate',
      'diff',
      '--from-empty',
      '--to-schema-datamodel',
      schemaPath,
      '--script',
    ],
    {
      cwd: rootDir,
      encoding: 'utf8',
    },
  )
    .replace(/\r\n/g, '\n')
    .trim();
  const supplementalSql = [
    '-- AddForeignKey',
    'ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE ON UPDATE CASCADE;',
  ].join('\n');

  return [
    '-- Comanda Flow',
    '-- Generated from prisma/schema.prisma as an empty-database baseline.',
    '-- Includes supplemental SQL for objects Prisma cannot model directly, such as auth.users FKs.',
    '-- Do not edit manually; run `npm run prisma:sql:generate`.',
    '',
    'BEGIN;',
    '',
    diffOutput,
    '',
    supplementalSql,
    '',
    'COMMIT;',
    '',
  ].join('\n');
}

function generateSeedSql(): string {
  const {
    tenant,
    subscription,
    categories,
    modifierGroup,
    menuItems,
    menuItemModifierGroups,
    tables,
  } = demoSeed;
  const trialPeriodSql = `CURRENT_TIMESTAMP + INTERVAL '${demoSeed.trialDays} days'`;
  const categoryValuesSql = categories
    .map(
      (category) =>
        `        (${quoteSql(category.id)}, ${quoteSql(category.name)}, ${nullableSql(category.icon)}, ${category.sortOrder})`,
    )
    .join(',\n');
  const modifierOptionValuesSql = modifierGroup.options
    .map(
      (option) => `    (
        ${quoteSql(option.id)},
        ${quoteSql(modifierGroup.id)},
        ${quoteSql(option.name)},
        ${option.priceCents},
        ${option.sortOrder},
        ${boolSql(option.isActive)},
        CURRENT_TIMESTAMP
    )`,
    )
    .join(',\n');
  const menuItemStatementsSql = menuItems
    .map(
      (item) => `INSERT INTO "MenuItem" (
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
    ${quoteSql(item.id)},
    tenant."id",
    ${quoteSql(item.categoryId)},
    ${quoteSql(item.name)},
    ${nullableSql(item.description)},
    ${item.priceCents},
    NULL,
    ${boolSql(item.isBestSeller)},
    ${boolSql(item.isActive)},
    CURRENT_TIMESTAMP
FROM "Tenant" AS tenant
WHERE tenant."slug" = ${quoteSql(tenant.slug)}
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
    "updatedAt" = CURRENT_TIMESTAMP;`,
    )
    .join('\n\n');
  const menuItemModifierGroupValuesSql = menuItemModifierGroups
    .map(
      (link) => `(
    ${quoteSql(link.id)},
    ${quoteSql(link.menuItemId)},
    ${quoteSql(link.modifierGroupId)},
    ${link.sortOrder}
)`,
    )
    .join(',\n');
  const tableValuesSql = tables
    .map(
      (table) =>
        `        (${quoteSql(table.id)}, ${table.number}, ${enumSql(table.status, 'TableStatus')})`,
    )
    .join(',\n');

  return `-- Comanda Flow
-- Generated from prisma/seed-data.ts to match prisma/seed.ts.
-- This seed provisions tenant, catalog and subscription data only.
-- Provision authenticated users separately via /auth/register or the Supabase Auth admin API.

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
    ${quoteSql(tenant.id)},
    ${quoteSql(tenant.slug)},
    ${quoteSql(tenant.name)},
    ${nullableSql(tenant.address)},
    ${nullableSql(tenant.city)},
    ${nullableSql(tenant.phone)},
    ${nullableSql(tenant.whatsapp)},
    ${nullableSql(tenant.hours)},
    ${nullableSql(tenant.logoUrl)},
    ${enumSql(tenant.planId, 'PlanId')},
    ${trialPeriodSql},
    ${tenant.maxTables},
    ${textArraySql(tenant.deliveryAreas)},
    ${textArraySql(tenant.paymentMethods)},
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
    ${quoteSql(subscription.id)},
    "id",
    NULL,
    NULL,
    NULL,
    ${enumSql(subscription.status, 'SubscriptionStatus')},
    ${trialPeriodSql},
    CURRENT_TIMESTAMP
FROM "Tenant"
WHERE "slug" = ${quoteSql(tenant.slug)}
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
${categoryValuesSql}
) AS seeded("id", "name", "icon", "sortOrder")
WHERE tenant."slug" = ${quoteSql(tenant.slug)}
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
    ${quoteSql(modifierGroup.id)},
    "id",
    ${quoteSql(modifierGroup.name)},
    ${nullableSql(modifierGroup.description)},
    ${boolSql(modifierGroup.isRequired)},
    ${modifierGroup.minSelections},
    ${modifierGroup.maxSelections},
    ${modifierGroup.sortOrder},
    CURRENT_TIMESTAMP
FROM "Tenant"
WHERE "slug" = ${quoteSql(tenant.slug)}
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
${modifierOptionValuesSql}
ON CONFLICT ("id")
DO UPDATE SET
    "modifierGroupId" = EXCLUDED."modifierGroupId",
    "name" = EXCLUDED."name",
    "priceCents" = EXCLUDED."priceCents",
    "sortOrder" = EXCLUDED."sortOrder",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = CURRENT_TIMESTAMP;

${menuItemStatementsSql}

INSERT INTO "MenuItemModifierGroup" (
    "id",
    "menuItemId",
    "modifierGroupId",
    "sortOrder"
)
VALUES
${menuItemModifierGroupValuesSql}
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
${tableValuesSql}
) AS seeded("id", "number", "status")
WHERE tenant."slug" = ${quoteSql(tenant.slug)}
ON CONFLICT ("tenantId", "number")
DO UPDATE SET
    "status" = EXCLUDED."status",
    "updatedAt" = CURRENT_TIMESTAMP;

COMMIT;
`;
}

function main(): void {
  mkdirSync(sqlDir, { recursive: true });
  writeFileSync(initSqlPath, generateInitSql(), 'utf8');
  writeFileSync(seedSqlPath, generateSeedSql(), 'utf8');

  console.log(`Generated ${path.relative(rootDir, initSqlPath)}`);
  console.log(`Generated ${path.relative(rootDir, seedSqlPath)}`);
}

main();
