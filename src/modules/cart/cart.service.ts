import { Injectable } from '@nestjs/common';
import { InjectRepository } from 'src/common/decorators/inject.decorator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
  ) {}

  async findAllCarts(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Cart>> {
    const { page, limit } = paginationDto;
    const offset = (page - 1) * limit;

    const [data, total] = await this.cartRepository.findAndCount({
      take: limit,
      skip: offset,
      order: {
        id: 'ASC',
      },
      relations: {
        user: true,
        cartItems: { product: true },
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

  async findCartById(id: number): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: { id },
      relations: {
        cartItems: true,
      },
    });
  }

  async getOrCreateCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: {
        cartItems: {
          product: true,
        },
      },
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId });
      cart = await this.cartRepository.save(cart);
      cart.cartItems = [];
    }

    return cart;
  }
}
