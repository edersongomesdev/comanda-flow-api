import {
  Body,
  Controller,
  Get,
  GoneException,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiGoneResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserData } from '../../common/types/current-user.type';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Provision a Supabase Auth owner user, tenant and profile.',
  })
  @ApiBadRequestResponse({ description: 'Invalid registration payload.' })
  @ApiServiceUnavailableResponse({
    description:
      'User registration is disabled until SUPABASE_SERVICE_ROLE_KEY is configured on the backend.',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary:
      'Deprecated. Authentication must be handled by Supabase Auth on the frontend.',
  })
  @ApiGoneResponse({
    description:
      'Password login is no longer handled by the backend. Use Supabase Auth in the frontend and send the resulting bearer token to the API.',
  })
  login() {
    throw new GoneException(
      'Password login is no longer handled by the API. Authenticate with Supabase Auth in the frontend and send the Supabase bearer token to the backend.',
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Return the authenticated Supabase user and internal profile.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Requires a valid Supabase bearer token and an existing internal userProfile.',
  })
  @ApiServiceUnavailableResponse({
    description:
      'Supabase bearer token validation is unavailable until SUPABASE_ANON_KEY is configured on the backend.',
  })
  me(@CurrentUser() currentUser: CurrentUserData) {
    return this.authService.getMe(currentUser);
  }
}
