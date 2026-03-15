import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CurrentUserData } from '../../../common/types/current-user.type';
import { SupabaseAuthService } from '../supabase-auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
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

    const supabaseUser =
      await this.supabaseAuthService.getUserFromAccessToken(token);

    if (!supabaseUser?.email) {
      throw new UnauthorizedException(
        'Invalid or expired Supabase access token.',
      );
    }

    const profile = await this.prisma.userProfile.findUnique({
      where: { id: supabaseUser.id },
      select: {
        id: true,
        tenantId: true,
        role: true,
      },
    });

    if (!profile) {
      throw new UnauthorizedException(
        'Authenticated Supabase user does not have an application profile.',
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
