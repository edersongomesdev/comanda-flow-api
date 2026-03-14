import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CurrentUserData } from '../../../common/types/current-user.type';
import { JwtPayload } from '../../../common/types/jwt-payload.type';
import { SupabaseAuthService } from '../supabase-auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly supabaseAuthService: SupabaseAuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: CurrentUserData;
    }>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const supabaseUser = await this.supabaseAuthService.getUserFromAccessToken(
      token,
    );

    if (supabaseUser) {
      const profile = await this.prisma.userProfile.findUnique({
        where: { id: supabaseUser.id },
        select: {
          id: true,
          tenantId: true,
          role: true,
        },
      });

      if (!profile || !supabaseUser.email) {
        throw new UnauthorizedException(
          'Authenticated Supabase user is missing an application profile.',
        );
      }

      request.user = {
        userId: profile.id,
        tenantId: profile.tenantId,
        email: supabaseUser.email,
        role: profile.role,
        authProvider: 'supabase',
      };

      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      request.user = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        email: payload.email,
        role: payload.role,
        authProvider: 'legacy',
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  private extractBearerToken(authorizationHeader?: string) {
    if (!authorizationHeader) {
      return undefined;
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return undefined;
    }

    return token.trim();
  }
}
