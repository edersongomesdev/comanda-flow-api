import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicService } from './public.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get(':slug/menu')
  @ApiOperation({ summary: 'Return the public menu resolved by tenant slug.' })
  getMenu(@Param('slug') slug: string) {
    return this.publicService.getMenu(slug);
  }
}
