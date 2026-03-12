import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTableDto } from './dto/create-table.dto';
import { TablesService } from './tables.service';

@ApiTags('tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @ApiOperation({ summary: 'List tables for the authenticated tenant.' })
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.tablesService.list(tenantId);
  }

  @Post()
  @ApiOperation({
    summary:
      'Create a table for the authenticated tenant, respecting plan limits.',
  })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateTableDto,
  ) {
    return this.tablesService.create(tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a table belonging to the authenticated tenant.',
  })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.tablesService.remove(tenantId, id);
  }
}
