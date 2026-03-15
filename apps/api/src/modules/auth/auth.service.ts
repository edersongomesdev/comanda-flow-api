import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { SubscriptionStatus, UserRole } from '@prisma/client';
import { CurrentUserData } from '../../common/types/current-user.type';
import { PLAN_FEATURES } from '../../common/utils/plan-features';
import { slugify } from '../../common/utils/slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { SupabaseAuthService } from './supabase-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAuthService: SupabaseAuthService,
  ) {}

  async register(dto: RegisterDto) {
    const ownerName = dto.name.trim();
    if (!ownerName) {
      throw new BadRequestException('Name is required.');
    }

    const email = dto.email.trim().toLowerCase();
    const plan = PLAN_FEATURES[dto.planId];
    if (!plan) {
      throw new BadRequestException('Invalid plan.');
    }

    if (!this.supabaseAuthService.isAdminConfigured()) {
      throw new ServiceUnavailableException(
        'User registration is unavailable until SUPABASE_SERVICE_ROLE_KEY is configured.',
      );
    }

    const tenantName = dto.tenantName?.trim() || ownerName;
    const tenantSlug = await this.resolveTenantSlug({
      tenantName,
      requestedTenantSlug: dto.tenantSlug?.trim(),
      email,
    });
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const authUser = await this.supabaseAuthService.createUser({
      email,
      password: dto.password,
      name: ownerName,
      role: UserRole.OWNER,
      tenantName,
      tenantSlug,
    });

    try {
      const createdAccount = await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            slug: tenantSlug,
            name: tenantName,
            planId: dto.planId,
            maxTables: plan.maxTables,
            trialEndsAt,
            deliveryAreas: [],
            paymentMethods: [],
          },
        });

        await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            status: SubscriptionStatus.TRIALING,
          },
        });

        const userProfile = await tx.userProfile.create({
          data: {
            id: authUser.id,
            tenantId: tenant.id,
            name: ownerName,
            role: UserRole.OWNER,
          },
        });

        return {
          tenant,
          userProfile,
        };
      });

      return {
        authProvider: 'supabase' as const,
        user: {
          id: createdAccount.userProfile.id,
          tenantId: createdAccount.userProfile.tenantId,
          name: createdAccount.userProfile.name,
          email,
          role: createdAccount.userProfile.role,
        },
        tenant: {
          id: createdAccount.tenant.id,
          slug: createdAccount.tenant.slug,
          name: createdAccount.tenant.name,
          planId: createdAccount.tenant.planId,
          trialEndsAt: createdAccount.tenant.trialEndsAt,
        },
        subscription: {
          status: SubscriptionStatus.TRIALING,
        },
      };
    } catch (error) {
      await this.supabaseAuthService.deleteUser(authUser.id);
      throw error;
    }
  }

  async getMe(currentUser: CurrentUserData) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      throw new UnauthorizedException(
        'Authenticated Supabase user profile was not found.',
      );
    }

    return {
      ...profile,
      email: currentUser.email,
      authProvider: currentUser.authProvider,
    };
  }

  private async resolveTenantSlug(input: {
    tenantName: string;
    requestedTenantSlug?: string;
    email: string;
  }) {
    const normalizedRequestedSlug = input.requestedTenantSlug
      ? slugify(input.requestedTenantSlug)
      : undefined;

    if (input.requestedTenantSlug && !normalizedRequestedSlug) {
      throw new BadRequestException('Invalid tenant slug.');
    }

    const baseSlug =
      normalizedRequestedSlug ||
      slugify(input.tenantName) ||
      slugify(input.email.split('@')[0]) ||
      `tenant-${Date.now()}`;

    if (normalizedRequestedSlug) {
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { slug: normalizedRequestedSlug },
        select: { id: true },
      });

      if (existingTenant) {
        throw new ConflictException('This tenant slug is already in use.');
      }

      return normalizedRequestedSlug;
    }

    const existingTenantSlugs = await this.prisma.tenant.findMany({
      where: { slug: { startsWith: baseSlug } },
      select: { slug: true },
    });

    return this.buildAvailableSlug(
      baseSlug,
      existingTenantSlugs.map(({ slug }) => slug),
    );
  }

  private buildAvailableSlug(baseSlug: string, existingSlugs: string[]) {
    const takenSlugs = new Set(existingSlugs);

    if (!takenSlugs.has(baseSlug)) {
      return baseSlug;
    }

    let suffix = 2;
    while (takenSlugs.has(`${baseSlug}-${suffix}`)) {
      suffix += 1;
    }

    return `${baseSlug}-${suffix}`;
  }
}
