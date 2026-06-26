import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from 'src/common/decorators/inject.decorator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  private async validateParentCategory(
    categoryId: number | null,
    parentId?: number,
  ): Promise<void> {
    if (!parentId) return;

    const parent = await this.categoryRepository.findOneBy({
      id: parentId,
    });

    if (!parent) {
      throw new NotFoundException('Parent category not found');
    }

    // Create category doesn't need to check circular
    if (!categoryId) return;

    // Self parent
    if (categoryId === parentId) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    // Circular hierarchy:
    // A -> B -> C -> A
    let current: Category | null = parent;

    while (current) {
      if (current.id === categoryId) {
        throw new BadRequestException('Circular category hierarchy detected');
      }

      if (!current.parentId) {
        break;
      }

      current = await this.categoryRepository.findOneBy({
        id: current.parentId,
      });
    }
  }

  async getAllCategories(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Category>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const [data, total] = await this.categoryRepository.findAndCount({
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

  async getCategoryById(id: number) {
    const category = await this.categoryRepository.findOneBy({ id });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    await this.validateParentCategory(null, data.parentId);

    const category = this.categoryRepository.create(data);

    try {
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === '23505'
      ) {
        throw new ConflictException('Slug already in use');
      }
      throw new InternalServerErrorException('Cannot create category');
    }
  }

  async updateCategory(id: number, data: UpdateCategoryDto): Promise<Category> {
    const category = await this.getCategoryById(id);

    await this.validateParentCategory(id, data.parentId);

    Object.assign(category, data);

    try {
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === '23505'
      ) {
        throw new ConflictException('Slug already in use');
      }
      throw new InternalServerErrorException('Cannot update category');
    }
  }

  async removeCategory(id: number) {
    const category = await this.getCategoryById(id);
    await this.categoryRepository.remove(category);
  }
}
