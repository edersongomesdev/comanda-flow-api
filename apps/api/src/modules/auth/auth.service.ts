import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionStatus, User, UserRole } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { CurrentUserData } from '../../common/types/current-user.type';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { PLAN_FEATURES } from '../../common/utils/plan-features';
import { slugify } from '../../common/utils/slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const ownerName = dto.name.trim();
    if (!ownerName) {
      throw new BadRequestException('Name is required.');
    }

    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    const plan = PLAN_FEATURES[dto.planId];
    if (!plan) {
      throw new BadRequestException('Invalid plan.');
    }

    const tenantName = dto.tenantName?.trim() || ownerName;
    const tenantSlug = await this.resolveTenantSlug({
      tenantName,
      requestedTenantSlug: dto.tenantSlug?.trim(),
      email,
    });
    const passwordHash = await hash(dto.password, 10);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const user = await this.prisma.$transaction(async (tx) => {
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

      return tx.user.create({
        data: {
          tenantId: tenant.id,
          name: ownerName,
          email,
          passwordHash,
          role: UserRole.OWNER,
        },
      });
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordMatches = await compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.buildAuthResponse(user);
  }

  async getMe(currentUser: CurrentUserData) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: currentUser.userId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private buildAuthResponse(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
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
