import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBody,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserData } from '../../common/types/current-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from './dto/create-portal-session.dto';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe checkout session.' })
  createCheckoutSession(
    @CurrentUser() currentUser: CurrentUserData,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.billingService.createCheckoutSession(currentUser, dto);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the current tenant subscription state.' })
  getSubscription(@CurrentUser('tenantId') tenantId: string) {
    return this.billingService.getSubscription(tenantId);
  }

  @Post('portal-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe customer portal session.' })
  createPortalSession(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreatePortalSessionDto = new CreatePortalSessionDto(),
  ) {
    return this.billingService.createPortalSession(tenantId, dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe billing webhooks.' })
  handleWebhook(
    @Headers('stripe-signature') signature: string | undefined,
    @RawBody() rawBody: Buffer | undefined,
  ) {
    return this.billingService.handleWebhook(rawBody, signature);
  }
}
