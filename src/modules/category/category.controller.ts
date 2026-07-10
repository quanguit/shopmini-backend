import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { RoleGuard } from '../auth/guards/role.guard';
import { UserRole } from '../user/enums/user-role.enum';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { Category } from './entities/category.entity';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  findAllCategories(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Category>> {
    return this.categoryService.findAllCategories(paginationDto);
  }

  @Get(':id')
  findCategoryById(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoryService.getCategoryById(id);
  }

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN)
  createCategory(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.categoryService.createCategory(dto);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN)
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.updateCategory(id, dto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(204)
  removeCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.categoryService.removeCategory(id);
  }
}
