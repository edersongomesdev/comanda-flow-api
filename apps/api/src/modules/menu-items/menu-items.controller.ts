import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItemsService } from './menu-items.service';

@ApiTags('menu-items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('menu-items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List menu items for the authenticated tenant.' })
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.menuItemsService.list(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a menu item for the authenticated tenant.' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.menuItemsService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a menu item belonging to the authenticated tenant.',
  })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuItemsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a menu item belonging to the authenticated tenant.',
  })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.menuItemsService.remove(tenantId, id);
  }
}
