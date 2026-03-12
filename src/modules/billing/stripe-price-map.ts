import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanId } from '@prisma/client';

type StripePriceConfigKey =
  | 'STRIPE_PRICE_START'
  | 'STRIPE_PRICE_ESSENCIAL'
  | 'STRIPE_PRICE_MESA'
  | 'STRIPE_PRICE_PREMIUM';

export const STRIPE_PRICE_CONFIG_KEYS: Record<PlanId, StripePriceConfigKey> = {
  [PlanId.START]: 'STRIPE_PRICE_START',
  [PlanId.ESSENCIAL]: 'STRIPE_PRICE_ESSENCIAL',
  [PlanId.MESA]: 'STRIPE_PRICE_MESA',
  [PlanId.PREMIUM]: 'STRIPE_PRICE_PREMIUM',
};

function readTrimmedConfig(
  configService: ConfigService,
  key: StripePriceConfigKey,
): string | undefined {
  const value = configService.get<string>(key)?.trim();

  return value ? value : undefined;
}

export function resolveStripePriceId(
  configService: ConfigService,
  planId: PlanId,
) {
  const key = STRIPE_PRICE_CONFIG_KEYS[planId];
  const priceId = readTrimmedConfig(configService, key);

  if (!priceId) {
    throw new InternalServerErrorException(
      `Missing Stripe price configuration for plan ${planId}.`,
    );
  }

  return priceId;
}

export function resolvePlanIdFromStripePriceId(
  configService: ConfigService,
  stripePriceId: string,
) {
  const normalizedPriceId = stripePriceId.trim();

  return (
    Object.entries(STRIPE_PRICE_CONFIG_KEYS) as Array<
      [PlanId, StripePriceConfigKey]
    >
  ).find(
    ([, key]) => readTrimmedConfig(configService, key) === normalizedPriceId,
  )?.[0];
}
