import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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

const MAX_FIRST = 100;

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

    // Validate first
    if (first <= 0 || first > MAX_FIRST) {
      throw new BadRequestException(
        `\`first\` phải nằm trong khoảng 1-${MAX_FIRST}`,
      );
    }

    const sortColumn = this.getSortColumn(sortBy);

    // Helper build base query (dùng lại cho cả main query lẫn hasPreviousPage check)
    const buildBaseQuery = () => {
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
      return qb;
    };

    const qb = buildBaseQuery();

    // === COUNT TOTAL (trước khi apply cursor) ===
    const totalCount = await qb.getCount();

    // === APPLY CURSOR FILTER ===
    let cursorData: { sortValue: string | number | Date; id: number } | null =
      null;

    if (after) {
      cursorData = this.decodeCursor(after);
      // FIX: cursor không hợp lệ -> báo lỗi rõ ràng thay vì âm thầm bỏ qua
      if (!cursorData) {
        throw new BadRequestException('Cursor không hợp lệ');
      }

      const { sortValue, id } = cursorData;
      const op = sortDirection === SortDirection.DESC ? '<' : '>';

      // FIX: xử lý NULL trong cột sort bằng cách coalesce về so sánh an toàn
      // (giả định NULL luôn đứng cuối bất kể ASC/DESC - tuỳ nghiệp vụ có thể đổi)
      qb.andWhere(
        `(
        product.${sortColumn} ${op} :sortValue
        OR (product.${sortColumn} = :sortValue AND product.id ${op} :id)
        OR (product.${sortColumn} IS NULL AND :sortValueIsNull = false AND :sortDir = 'DESC')
      )`,
        {
          sortValue,
          id,
          sortValueIsNull: sortValue === null,
          sortDir: sortDirection,
        },
      );
    }

    // === APPLY SORT ===
    // FIX: chỉ định rõ NULLS LAST để tránh NULL trồi lên đầu/cuối không nhất quán
    qb.orderBy(`product.${sortColumn}`, sortDirection, 'NULLS LAST');
    qb.addOrderBy('product.id', sortDirection);

    // === LIMIT (lấy thêm 1 để check hasNextPage) ===
    qb.take(first + 1);

    // Execute query
    const products = await qb.getMany();

    // Check hasNextPage
    const hasNextPage = products.length > first;
    if (hasNextPage) {
      products.pop();
    }

    // === FIX: check hasPreviousPage bằng query thật thay vì suy đoán !!after ===
    let hasPreviousPage = false;
    if (after && cursorData && products.length > 0) {
      const { sortValue, id } = cursorData;
      const reverseOp = sortDirection === SortDirection.DESC ? '>' : '<';

      const prevCheckQb = buildBaseQuery();
      prevCheckQb.andWhere(
        `(
        product.${sortColumn} ${reverseOp} :sortValue
        OR (product.${sortColumn} = :sortValue AND product.id ${reverseOp} :id)
      )`,
        { sortValue, id },
      );
      const prevCount = await prevCheckQb.getCount();
      hasPreviousPage = prevCount > 0;
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
        hasPreviousPage,
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
  ): { sortValue: string | number | Date | null; id: number } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded) as {
        sortValue?: unknown;
        id?: unknown;
      };

      // FIX: cho phép sortValue là null (trường hợp field nullable như description)
      const validSortValue =
        parsed.sortValue === null ||
        typeof parsed.sortValue === 'string' ||
        typeof parsed.sortValue === 'number';

      if (typeof parsed.id !== 'number' || !validSortValue) {
        return null;
      }

      return {
        sortValue: parsed.sortValue as string | number | null,
        id: parsed.id,
      };
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
