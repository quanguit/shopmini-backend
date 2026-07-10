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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { RoleGuard } from '../auth/guards/role.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../user/enums/user-role.enum';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get()
  async findAllProducts(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Product>> {
    return this.productService.findAllProducts(paginationDto);
  }

  @Public()
  @Get(':id')
  async findProductById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Product> {
    return this.productService.findProductById(id);
  }

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.SELLER)
  async createProduct(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Product> {
    return this.productService.createProduct(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SELLER)
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Product> {
    return this.productService.updateProduct(id, user.sub, dto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SELLER)
  @HttpCode(204)
  async removeProduct(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.productService.removeProduct(id, user.sub);
  }
}
