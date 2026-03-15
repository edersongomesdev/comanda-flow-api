import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SupabaseAuthService } from './supabase-auth.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseAuthService, JwtAuthGuard],
  exports: [SupabaseAuthService, JwtAuthGuard],
})
export class AuthModule {}
