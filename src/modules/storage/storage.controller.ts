import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { StorageService } from './storage.service';

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Create a Supabase Storage signed upload URL.' })
  createUploadUrl(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateUploadUrlDto,
  ) {
    return this.storageService.createUploadUrl(tenantId, dto);
  }
}
