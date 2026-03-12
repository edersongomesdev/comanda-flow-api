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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List categories for the authenticated tenant.' })
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.categoriesService.list(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a category for the authenticated tenant.' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a category belonging to the authenticated tenant.',
  })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a category belonging to the authenticated tenant.',
  })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.categoriesService.remove(tenantId, id);
  }
}
