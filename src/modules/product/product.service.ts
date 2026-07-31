import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from 'src/common/decorators/inject.decorator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { Repository } from 'typeorm';
import { CategoryService } from '../category/category.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductStatus } from './enums/product.enum';
import {
  ProductSearchArgs,
  ProductSortField,
  SortDirection,
} from './graphql/product-search.args';
import { ProductConnection, ProductType } from './graphql/product.types';

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

  // === GRAPHQL: Search Products with Cursor Pagination ===
  // Tìm kiếm sản phẩm với filter, sort, cursor-based pagination
  async searchProducts(args: ProductSearchArgs): Promise<ProductConnection> {
    const {
      categoryId,
      minPrice,
      maxPrice,
      keyword,
      sortBy,
      sortDirection,
      first,
      after,
    } = args;

    // Tạo base query (KHÔNG join relations - dùng DataLoader)
    const qb = this.productRepository
      .createQueryBuilder('product')
      .where('product.status = :status', { status: ProductStatus.PUBLISHED });

    // === APPLY FILTERS ===

    // Filter theo category
    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    // Filter theo khoảng giá
    if (minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Filter theo keyword (tìm trong name và description)
    if (keyword) {
      qb.andWhere(
        '(product.name ILIKE :keyword OR product.description ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // === COUNT TOTAL (trước khi apply cursor) ===
    const totalCount = await qb.getCount();

    // === APPLY CURSOR FILTER ===
    // Decode cursor và apply keyset pagination
    if (after) {
      const cursorData = this.decodeCursor(after);
      if (cursorData) {
        const { sortValue, id } = cursorData;
        const sortColumn = this.getSortColumn(sortBy);
        const op = sortDirection === SortDirection.DESC ? '<' : '>';

        // Keyset pagination: (sortColumn, id) comparison
        // Ensures consistent ordering even with duplicate sort values
        qb.andWhere(
          `(product.${sortColumn} ${op} :sortValue OR (product.${sortColumn} = :sortValue AND product.id ${op} :id))`,
          { sortValue, id },
        );
      }
    }

    // === APPLY SORT ===
    const sortColumn = this.getSortColumn(sortBy);
    qb.orderBy(`product.${sortColumn}`, sortDirection);
    // Secondary sort by id for stable ordering
    qb.addOrderBy('product.id', sortDirection);

    // === LIMIT (lấy thêm 1 để check hasNextPage) ===
    qb.take(first + 1);

    // Execute query
    const products = await qb.getMany();

    // Check hasNextPage
    const hasNextPage = products.length > first;
    if (hasNextPage) {
      products.pop(); // Remove extra item
    }

    // Build edges with cursors
    const edges = products.map((product) => ({
      cursor: this.encodeCursor(product, sortBy),
      node: this.toProductType(product),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: edges.length > 0 ? edges[0].cursor : undefined,
        endCursor:
          edges.length > 0 ? edges[edges.length - 1].cursor : undefined,
      },
      totalCount,
    };
  }

  // Helper: Encode cursor (sortValue + id) thành Base64
  private encodeCursor(product: Product, sortBy: ProductSortField): string {
    const sortColumn = this.getSortColumn(sortBy);
    const cursorData = {
      sortValue: product[sortColumn as keyof Product],
      id: product.id,
    };
    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  // Helper: Decode Base64 cursor về object
  private decodeCursor(
    cursor: string,
  ): { sortValue: string | number | Date; id: number } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded) as {
        sortValue?: unknown;
        id?: unknown;
      };

      // Validate parsed structure
      if (
        typeof parsed.id !== 'number' ||
        (typeof parsed.sortValue !== 'string' &&
          typeof parsed.sortValue !== 'number')
      ) {
        return null;
      }

      return { sortValue: parsed.sortValue, id: parsed.id };
    } catch {
      return null;
    }
  }

  // Helper: Map sort field enum sang column name
  private getSortColumn(sortBy: ProductSortField): string {
    const mapping: Record<ProductSortField, string> = {
      [ProductSortField.PRICE]: 'price',
      [ProductSortField.CREATED_AT]: 'createdAt',
      [ProductSortField.NAME]: 'name',
    };
    return mapping[sortBy];
  }

  // Helper: Map Product entity sang ProductType (GraphQL)
  // Chỉ trả về các field cơ bản - seller/category được resolve riêng
  private toProductType(product: Product): ProductType {
    return {
      id: product.id,
      sellerId: product.sellerId,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      images: product.images,
      status: product.status,
      createdAt: product.createdAt,
    };
  }
}
