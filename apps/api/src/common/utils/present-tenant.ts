import { PlanId } from '@prisma/client';
import { getPlanFeatures } from './plan-features';
import { calculateTrialDaysLeft } from './trial-days-left';

interface TenantPresenterInput {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  hours: string | null;
  logoUrl: string | null;
  planId: PlanId;
  trialEndsAt: Date | null;
  maxTables: number;
  deliveryAreas: string[];
  paymentMethods: string[];
}

export function presentTenant(tenant: TenantPresenterInput) {
  const features = getPlanFeatures(tenant.planId);
  const maxTables =
    tenant.maxTables > 0 ? tenant.maxTables : features.maxTables;

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    address: tenant.address,
    city: tenant.city,
    phone: tenant.phone,
    whatsapp: tenant.whatsapp,
    hours: tenant.hours,
    logoUrl: tenant.logoUrl,
    planId: tenant.planId,
    trialEndsAt: tenant.trialEndsAt,
    trialDaysLeft: calculateTrialDaysLeft(tenant.trialEndsAt),
    maxTables,
    deliveryAreas: tenant.deliveryAreas,
    paymentMethods: tenant.paymentMethods,
    features: {
      tables: features.tables,
      pipeline: features.pipeline,
      whatsappKit: features.whatsappKit,
    },
    limits: {
      maxTables,
    },
  };
}
