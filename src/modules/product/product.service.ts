import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from 'src/common/decorators/inject.decorator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { Repository } from 'typeorm';
import { CategoryService } from '../category/category.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly categoryService: CategoryService,
  ) {}

  async findAllProducts(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Product>> {
    const { page, limit } = paginationDto;
    const offset = (page - 1) * limit;

    const [data, total] = await this.productRepository.findAndCount({
      take: limit,
      skip: offset,
      order: {
        id: 'ASC',
      },
    });

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findProductById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async createProduct(
    userId: number,
    data: CreateProductDto,
  ): Promise<Product> {
    await this.categoryService.getCategoryById(data.categoryId);

    const newProduct = this.productRepository.create({
      ...data,
      sellerId: userId,
    });
    return this.productRepository.save(newProduct);
  }

  async updateProduct(id: number, data: UpdateProductDto): Promise<Product> {
    const product = await this.findProductById(id);

    if (data.categoryId) {
      await this.categoryService.getCategoryById(data.categoryId);
    }

    Object.assign(product, data);

    try {
      return await this.productRepository.save(product);
    } catch (error) {
      this.logger.error('Error updating product', error);
      throw error;
    }
  }

  async removeProduct(id: number): Promise<void> {
    const product = await this.findProductById(id);

    try {
      await this.productRepository.remove(product);
    } catch (error) {
      this.logger.error('Error removing product', error);
      throw error;
    }
  }
}
