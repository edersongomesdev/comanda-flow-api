import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanId, Prisma, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';
import { CurrentUserData } from '../../common/types/current-user.type';
import {
  getPlanFeatures,
  normalizePlanIdInput,
} from '../../common/utils/plan-features';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from './dto/create-portal-session.dto';
import {
  resolvePlanIdFromStripePriceId,
  resolveStripePriceId,
} from './stripe-price-map';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripeClient?: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createCheckoutSession(
    currentUser: CurrentUserData,
    dto: CreateCheckoutSessionDto,
  ) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: currentUser.tenantId },
      select: {
        id: true,
        name: true,
        subscription: {
          select: {
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            status: true,
          },
        },
      },
    });

    if (
      tenant.subscription?.stripeSubscriptionId &&
      tenant.subscription.status !== SubscriptionStatus.CANCELED
    ) {
      throw new ConflictException(
        'This tenant already has a Stripe subscription. Use the billing portal to manage it.',
      );
    }

    const stripe = this.getStripeClient();
    const priceId = resolveStripePriceId(this.configService, dto.planId);
    const customerId = await this.ensureStripeCustomer({
      existingCustomerId: tenant.subscription?.stripeCustomerId,
      tenantId: tenant.id,
      tenantName: tenant.name,
      customerEmail: currentUser.email,
    });
    const successUrl =
      dto.successUrl ?? this.buildFrontendUrl('/billing?checkout=success');
    const cancelUrl =
      dto.cancelUrl ?? this.buildFrontendUrl('/billing?checkout=canceled');
    const metadata = this.buildBillingMetadata(tenant.id, dto.planId);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: tenant.id,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      subscription_data: {
        metadata,
      },
    });

    if (!session.url) {
      throw new InternalServerErrorException(
        'Stripe checkout session was created without a redirect URL.',
      );
    }

    await this.prisma.subscription.upsert({
      where: { tenantId: tenant.id },
      update: {
        stripeCustomerId: customerId,
      },
      create: {
        tenantId: tenant.id,
        stripeCustomerId: customerId,
        status: SubscriptionStatus.INCOMPLETE,
      },
    });

    this.logger.log(
      `Created Stripe checkout session for tenant ${tenant.id} and plan ${dto.planId}.`,
    );

    return { url: session.url };
  }

  getSubscription(tenantId: string) {
    return this.prisma.subscription.findUnique({
      where: { tenantId },
    });
  }

  async createPortalSession(tenantId: string, dto: CreatePortalSessionDto) {
    const stripe = this.getStripeClient();

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!subscription?.stripeCustomerId) {
      throw new BadRequestException(
        'Stripe customer is not available for this tenant yet.',
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: dto.returnUrl ?? this.buildFrontendUrl('/billing'),
    });

    this.logger.log(`Created Stripe portal session for tenant ${tenantId}.`);

    return { url: session.url };
  }

  async handleWebhook(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ) {
    if (!rawBody) {
      throw new BadRequestException(
        'Stripe webhook raw body is required for signature validation.',
      );
    }

    if (!signature) {
      throw new BadRequestException('Missing Stripe signature header.');
    }

    const stripe = this.getStripeClient();
    const webhookSecret = this.getRequiredConfigValue(
      'STRIPE_WEBHOOK_SECRET',
      'Stripe webhook secret is not configured.',
    );

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown Stripe webhook error.';
      this.logger.warn(`Rejected Stripe webhook: ${message}`);
      throw new BadRequestException('Invalid Stripe webhook signature.');
    }

    await this.processWebhookEvent(event);

    return { received: true };
  }

  private getStripeClient() {
    if (!this.stripeClient) {
      this.stripeClient = new Stripe(
        this.getRequiredConfigValue(
          'STRIPE_SECRET_KEY',
          'Stripe secret key is not configured.',
        ),
        {
          maxNetworkRetries: 2,
          typescript: true,
        },
      );
    }

    return this.stripeClient;
  }

  private getRequiredConfigValue(key: string, errorMessage: string) {
    const value = this.configService.get<string>(key)?.trim();

    if (!value) {
      throw new InternalServerErrorException(errorMessage);
    }

    return value;
  }

  private buildBillingMetadata(tenantId: string, planId: PlanId) {
    return {
      tenantId,
      planId,
    };
  }

  private buildFrontendUrl(pathname: string) {
    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL', 'http://localhost:4173') ??
      'http://localhost:4173'
    ).trim();

    return new URL(pathname, frontendUrl).toString();
  }

  private async ensureStripeCustomer(params: {
    existingCustomerId?: string | null;
    tenantId: string;
    tenantName: string;
    customerEmail: string;
  }) {
    if (params.existingCustomerId) {
      return params.existingCustomerId;
    }

    const customer = await this.getStripeClient().customers.create({
      email: params.customerEmail,
      name: params.tenantName,
      metadata: {
        tenantId: params.tenantId,
      },
    });

    return customer.id;
  }

  private async processWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (
          session.mode !== 'subscription' ||
          typeof session.subscription !== 'string'
        ) {
          this.logger.warn(
            `Skipping checkout.session.completed without a subscription for event ${event.id}.`,
          );
          return;
        }

        const stripeSubscription =
          await this.getStripeClient().subscriptions.retrieve(
            session.subscription,
          );

        await this.syncStripeSubscription({
          stripeSubscription,
          source: event.type,
          fallbackPlanId: this.normalizePlanId(session.metadata?.planId),
          fallbackTenantId:
            this.readNonEmptyString(session.metadata?.tenantId) ??
            this.readNonEmptyString(session.client_reference_id),
        });

        return;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubscription =
          await this.getStripeClient().subscriptions.retrieve(subscription.id);

        await this.syncStripeSubscription({
          stripeSubscription,
          source: event.type,
        });

        return;
      }

      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object as Stripe.Subscription;

        await this.syncStripeSubscription({
          stripeSubscription,
          source: event.type,
        });

        return;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId =
          this.extractInvoiceSubscriptionId(invoice);

        if (!stripeSubscriptionId) {
          this.logger.warn(
            `Skipping invoice.payment_failed without a subscription for event ${event.id}.`,
          );
          return;
        }

        const stripeSubscription =
          await this.getStripeClient().subscriptions.retrieve(
            stripeSubscriptionId,
          );

        await this.syncStripeSubscription({
          stripeSubscription,
          source: event.type,
        });

        return;
      }

      default:
        return;
    }
  }

  private async syncStripeSubscription(params: {
    stripeSubscription: Stripe.Subscription;
    source: Stripe.Event.Type;
    fallbackPlanId?: PlanId;
    fallbackTenantId?: string;
  }) {
    const stripeCustomerId = this.extractStripeCustomerId(
      params.stripeSubscription.customer,
    );
    const stripePriceId = this.extractStripePriceId(params.stripeSubscription);
    const tenantId = await this.resolveTenantIdForStripeSubscription({
      fallbackTenantId: params.fallbackTenantId,
      stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscription.id,
      metadataTenantId: this.readNonEmptyString(
        params.stripeSubscription.metadata?.tenantId,
      ),
    });
    const planId =
      (stripePriceId &&
        resolvePlanIdFromStripePriceId(this.configService, stripePriceId)) ??
      params.fallbackPlanId ??
      this.normalizePlanId(params.stripeSubscription.metadata?.planId);
    const status = this.mapStripeSubscriptionStatus(
      params.stripeSubscription.status,
    );
    const currentPeriodEnd = this.extractCurrentPeriodEnd(
      params.stripeSubscription,
    );
    const nextTenantPlanId =
      status === SubscriptionStatus.CANCELED ? PlanId.START : planId;

    if (!planId && status !== SubscriptionStatus.CANCELED) {
      this.logger.warn(
        `Unable to resolve planId for Stripe subscription ${params.stripeSubscription.id}.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.upsert({
        where: { tenantId },
        update: {
          stripeCustomerId: stripeCustomerId ?? null,
          stripeSubscriptionId: params.stripeSubscription.id,
          stripePriceId: stripePriceId ?? null,
          status,
          currentPeriodEnd,
        },
        create: {
          tenantId,
          stripeCustomerId: stripeCustomerId ?? null,
          stripeSubscriptionId: params.stripeSubscription.id,
          stripePriceId: stripePriceId ?? null,
          status,
          currentPeriodEnd,
        },
      });

      if (nextTenantPlanId) {
        await tx.tenant.update({
          where: { id: tenantId },
          data: this.buildTenantPlanUpdate(nextTenantPlanId),
        });
      }
    });

    this.logger.log(
      `Synchronized Stripe subscription ${params.stripeSubscription.id} for tenant ${tenantId} from ${params.source}.`,
    );
  }

  private async resolveTenantIdForStripeSubscription(params: {
    metadataTenantId?: string;
    fallbackTenantId?: string;
    stripeSubscriptionId: string;
    stripeCustomerId?: string;
  }) {
    if (params.metadataTenantId) {
      return params.metadataTenantId;
    }

    if (params.fallbackTenantId) {
      return params.fallbackTenantId;
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        OR: [
          { stripeSubscriptionId: params.stripeSubscriptionId },
          ...(params.stripeCustomerId
            ? [{ stripeCustomerId: params.stripeCustomerId }]
            : []),
        ],
      },
      select: {
        tenantId: true,
      },
    });

    if (!subscription?.tenantId) {
      throw new InternalServerErrorException(
        `Unable to resolve tenant for Stripe subscription ${params.stripeSubscriptionId}.`,
      );
    }

    return subscription.tenantId;
  }

  private buildTenantPlanUpdate(planId: PlanId): Prisma.TenantUpdateInput {
    return {
      planId,
      maxTables: getPlanFeatures(planId).maxTables,
    };
  }

  private normalizePlanId(value: string | null | undefined) {
    return normalizePlanIdInput(value);
  }

  private readNonEmptyString(value: string | null | undefined) {
    const normalizedValue = value?.trim();

    return normalizedValue ? normalizedValue : undefined;
  }

  private extractStripeCustomerId(
    customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
  ) {
    if (!customer) {
      return undefined;
    }

    return typeof customer === 'string' ? customer : customer.id;
  }

  private extractStripePriceId(subscription: Stripe.Subscription) {
    return subscription.items.data[0]?.price?.id;
  }

  private extractInvoiceSubscriptionId(invoice: Stripe.Invoice) {
    const subscription = invoice.parent?.subscription_details?.subscription;

    if (!subscription) {
      return undefined;
    }

    return typeof subscription === 'string' ? subscription : subscription.id;
  }

  private extractCurrentPeriodEnd(subscription: Stripe.Subscription) {
    const currentPeriodEnds = subscription.items.data
      .map((item) => item.current_period_end)
      .filter((value): value is number => typeof value === 'number');

    if (currentPeriodEnds.length === 0) {
      return null;
    }

    return this.fromUnixTimestamp(Math.max(...currentPeriodEnds));
  }

  private fromUnixTimestamp(value: number | null | undefined) {
    if (!value) {
      return null;
    }

    return new Date(value * 1000);
  }

  private mapStripeSubscriptionStatus(
    status: Stripe.Subscription.Status,
  ): SubscriptionStatus {
    switch (status) {
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
      case 'unpaid':
      case 'paused':
        return SubscriptionStatus.PAST_DUE;
      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE;
      case 'incomplete_expired':
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      default:
        return SubscriptionStatus.INCOMPLETE;
    }
  }
}
