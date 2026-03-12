import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { validateEnv } from './config/env.validation';
import { BillingModule } from './modules/billing/billing.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { MenuItemsModule } from './modules/menu-items/menu-items.module';
import { PublicModule } from './modules/public/public.module';
import { StorageModule } from './modules/storage/storage.module';
import { TablesModule } from './modules/tables/tables.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    CategoriesModule,
    MenuItemsModule,
    PublicModule,
    TablesModule,
    DashboardModule,
    BillingModule,
    StorageModule,
    HealthModule,
  ],
})
export class AppModule {}
