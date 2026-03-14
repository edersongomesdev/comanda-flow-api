import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthApiError,
  AuthError,
  User,
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { UserRole } from '@prisma/client';

interface CreateSupabaseUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  tenantName: string;
  tenantSlug: string;
}

@Injectable()
export class SupabaseAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);
  private adminClient?: SupabaseClient;
  private authClient?: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  isAuthVerificationConfigured() {
    return Boolean(this.getSupabaseUrl() && this.getSupabaseApiKey());
  }

  async createUser(input: CreateSupabaseUserInput) {
    const { data, error } = await this.getAdminClient().auth.admin.createUser({
      email: input.email,
      password: input.password,
      // Keep new accounts usable during the migration window.
      email_confirm: true,
      user_metadata: {
        name: input.name,
        tenant_name: input.tenantName,
        tenant_slug: input.tenantSlug,
      },
      app_metadata: {
        role: input.role,
      },
    });

    if (error) {
      throw this.mapAdminError(error);
    }

    if (!data.user) {
      throw new InternalServerErrorException(
        'Supabase Auth user creation completed without returning a user.',
      );
    }

    return data.user;
  }

  async deleteUser(userId: string) {
    const { error } = await this.getAdminClient().auth.admin.deleteUser(userId);

    if (error) {
      this.logger.warn(
        `Failed to roll back Supabase Auth user ${userId}: ${error.message}`,
      );
    }
  }

  async getUserFromAccessToken(accessToken: string): Promise<User | null> {
    if (!this.isAuthVerificationConfigured()) {
      return null;
    }

    const { data, error } = await this.getAuthClient().auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    return data.user;
  }

  private mapAdminError(error: AuthError) {
    if (
      (error instanceof AuthApiError &&
        (error.status === 409 || error.status === 422)) ||
      /already been registered|already exists|duplicate/i.test(error.message)
    ) {
      return new ConflictException('An account with this email already exists.');
    }

    this.logger.error(`Supabase Auth error: ${error.message}`);

    return new InternalServerErrorException(
      'Could not create the Supabase Auth user.',
    );
  }

  private getAdminClient() {
    if (!this.adminClient) {
      const supabaseUrl = this.getRequiredConfigValue(
        'SUPABASE_URL',
        'Supabase URL is not configured.',
      );
      const serviceRoleKey = this.getRequiredConfigValue(
        'SUPABASE_SERVICE_ROLE_KEY',
        'Supabase service role key is not configured.',
      );

      this.adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    return this.adminClient;
  }

  private getAuthClient() {
    if (!this.authClient) {
      const supabaseUrl = this.getRequiredConfigValue(
        'SUPABASE_URL',
        'Supabase URL is not configured.',
      );
      const apiKey = this.getSupabaseApiKey();

      if (!apiKey) {
        throw new InternalServerErrorException(
          'Supabase anon or service role key is not configured.',
        );
      }

      this.authClient = createClient(supabaseUrl, apiKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    return this.authClient;
  }

  private getSupabaseUrl() {
    return this.configService.get<string>('SUPABASE_URL')?.trim();
  }

  private getSupabaseApiKey() {
    return (
      this.configService.get<string>('SUPABASE_ANON_KEY')?.trim() ||
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim()
    );
  }

  private getRequiredConfigValue(key: string, errorMessage: string) {
    const value = this.configService.get<string>(key)?.trim();

    if (!value) {
      this.logger.error(errorMessage);
      throw new InternalServerErrorException(errorMessage);
    }

    return value;
  }
}
