import {
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
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    const plan = PLAN_FEATURES[dto.planId];
    const tenantName = dto.tenantName?.trim() || dto.name.trim();
    const tenantSlug = slugify(dto.tenantSlug?.trim() || tenantName);
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
          name: dto.name.trim(),
          email: dto.email.toLowerCase(),
          passwordHash,
          role: UserRole.OWNER,
        },
      });
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
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
}
