import { PrismaClient } from '@prisma/client';
import { demoSeed } from './seed-data';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.event.deleteMany(),
    prisma.menuItemModifierGroup.deleteMany(),
    prisma.modifierOption.deleteMany(),
    prisma.modifierGroup.deleteMany(),
    prisma.menuItem.deleteMany(),
    prisma.category.deleteMany(),
    prisma.table.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.tenant.deleteMany(),
  ]);

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + demoSeed.trialDays);

  await prisma.tenant.create({
    data: {
      id: demoSeed.tenant.id,
      slug: demoSeed.tenant.slug,
      name: demoSeed.tenant.name,
      address: demoSeed.tenant.address,
      city: demoSeed.tenant.city,
      phone: demoSeed.tenant.phone,
      whatsapp: demoSeed.tenant.whatsapp,
      hours: demoSeed.tenant.hours,
      logoUrl: demoSeed.tenant.logoUrl,
      planId: demoSeed.tenant.planId,
      trialEndsAt,
      maxTables: demoSeed.tenant.maxTables,
      deliveryAreas: [...demoSeed.tenant.deliveryAreas],
      paymentMethods: [...demoSeed.tenant.paymentMethods],
      subscription: {
        create: {
          id: demoSeed.subscription.id,
          status: demoSeed.subscription.status,
        },
      },
    },
  });

  await prisma.category.createMany({
    data: demoSeed.categories.map((category) => ({
      id: category.id,
      tenantId: demoSeed.tenant.id,
      name: category.name,
      icon: category.icon,
      sortOrder: category.sortOrder,
    })),
  });

  await prisma.modifierGroup.create({
    data: {
      id: demoSeed.modifierGroup.id,
      tenantId: demoSeed.tenant.id,
      name: demoSeed.modifierGroup.name,
      description: demoSeed.modifierGroup.description,
      isRequired: demoSeed.modifierGroup.isRequired,
      minSelections: demoSeed.modifierGroup.minSelections,
      maxSelections: demoSeed.modifierGroup.maxSelections,
      sortOrder: demoSeed.modifierGroup.sortOrder,
      options: {
        create: demoSeed.modifierGroup.options.map((option) => ({
          id: option.id,
          name: option.name,
          priceCents: option.priceCents,
          sortOrder: option.sortOrder,
          isActive: option.isActive,
        })),
      },
    },
  });

  await prisma.menuItem.createMany({
    data: demoSeed.menuItems.map((item) => ({
      id: item.id,
      tenantId: demoSeed.tenant.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      priceCents: item.priceCents,
      isBestSeller: item.isBestSeller,
      isActive: item.isActive,
    })),
  });

  await prisma.menuItemModifierGroup.createMany({
    data: demoSeed.menuItemModifierGroups.map((link) => ({
      id: link.id,
      menuItemId: link.menuItemId,
      modifierGroupId: link.modifierGroupId,
      sortOrder: link.sortOrder,
    })),
  });

  await prisma.table.createMany({
    data: demoSeed.tables.map((table) => ({
      id: table.id,
      tenantId: demoSeed.tenant.id,
      number: table.number,
      status: table.status,
    })),
  });

  console.log(
    JSON.stringify(
      {
        tenantSlug: demoSeed.tenant.slug,
        authProvisioning:
          'Provision users via /auth/register or the Supabase Auth admin API.',
      },
      null,
      2,
    ),
  );
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
