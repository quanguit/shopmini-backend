import { Injectable } from '@nestjs/common';
import { InjectRepository } from 'src/common/decorators/inject.decorator';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
  ) {}

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
