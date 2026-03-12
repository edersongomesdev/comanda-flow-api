import { PlanId } from '@prisma/client';

export const PLAN_IDS = Object.values(PlanId);

export const PLAN_INPUT_ALIASES = [
  'start',
  'essencial',
  'mesa',
  'premium',
  'pro',
  'elite',
  ...PLAN_IDS,
] as const;

export const PLAN_FEATURES: Record<
  PlanId,
  {
    tables: boolean;
    pipeline: boolean;
    whatsappKit: boolean;
    maxTables: number;
  }
> = {
  [PlanId.START]: {
    tables: false,
    pipeline: false,
    whatsappKit: false,
    maxTables: 0,
  },
  [PlanId.ESSENCIAL]: {
    tables: false,
    pipeline: false,
    whatsappKit: true,
    maxTables: 0,
  },
  [PlanId.MESA]: {
    tables: true,
    pipeline: false,
    whatsappKit: true,
    maxTables: 15,
  },
  [PlanId.PREMIUM]: {
    tables: true,
    pipeline: true,
    whatsappKit: true,
    maxTables: 999,
  },
};

export function normalizePlanIdInput(value: unknown): PlanId | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  switch (value.trim().toLowerCase()) {
    case 'start':
      return PlanId.START;
    case 'essencial':
      return PlanId.ESSENCIAL;
    case 'mesa':
      return PlanId.MESA;
    case 'pro':
    case 'premium':
    case 'elite':
      return PlanId.PREMIUM;
    default:
      return PLAN_IDS.find((planId) => planId === value.trim().toUpperCase());
  }
}

export function getPlanFeatures(planId: PlanId) {
  return PLAN_FEATURES[planId];
}
