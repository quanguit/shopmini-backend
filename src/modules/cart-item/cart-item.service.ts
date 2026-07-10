import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from 'src/common/decorators/inject.decorator';
import { Repository } from 'typeorm';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { CreateCartItemDto } from './dtos/create-cart-item.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';
import { CartItem } from './entities/cart-item.entity';

@Injectable()
export class CartItemService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly cartService: CartService,
    private readonly productService: ProductService,
  ) {}

  async createCartItem(
    userId: number,
    dto: CreateCartItemDto,
  ): Promise<CartItem> {
    await this.productService.findProductById(dto.productId);

    const cart = await this.cartService.getOrCreateCart(userId);

    const existing = await this.cartItemRepository.findOne({
      where: {
        cartId: cart.id,
        productId: dto.productId,
      },
    });

    if (existing) {
      existing.quantity += dto.quantity;
      return this.cartItemRepository.save(existing);
    }

    const item = this.cartItemRepository.create({
      cartId: cart.id,
      productId: dto.productId,
      quantity: dto.quantity,
    });

    return this.cartItemRepository.save(item);
  }

  async updateCartItem(
    id: number,
    userId: number,
    dto: UpdateCartItemDto,
  ): Promise<CartItem> {
    const item = await this.cartItemRepository.findOne({
      where: { id },
      relations: {
        cart: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (item.cart.userId !== userId) {
      throw new ForbiddenException('You do not own this cart item');
    }

    item.quantity = dto.quantity;
    return this.cartItemRepository.save(item);
  }

  async removeCartItem(id: number, userId: number): Promise<void> {
    const item = await this.cartItemRepository.findOne({
      where: { id },
      relations: {
        cart: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (item.cart.userId !== userId) {
      throw new ForbiddenException('You do not own this cart item');
    }

    await this.cartItemRepository.remove(item);
  }
}
