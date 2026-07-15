import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from 'src/common/decorators/inject.decorator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { APP_DATA_SOURCE_TOKEN } from 'src/database/constants/data-source';
import { DataSource, Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Action, CaslAbilityFactory } from '../auth/casl/casl-ability.factory';
import { CartService } from '../cart/cart.service';
import { CartItem } from '../cart-item/entities/cart-item.entity';
import { OrderItem } from '../order-item/entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { UserRole } from '../user/enums/user-role.enum';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/order.enum';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject(APP_DATA_SOURCE_TOKEN)
    private readonly dataSource: DataSource,
    private readonly cartService: CartService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async findAllOrders(
    paginationDto: PaginationDto,
    user: JwtPayload,
  ): Promise<PaginatedResult<Order>> {
    const { page, limit } = paginationDto;
    const offset = (page - 1) * limit;

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product');

    if (user.role === UserRole.CUSTOMER) {
      qb.where('order.userId = :userId', { userId: user.sub });
    } else if (user.role === UserRole.SELLER) {
      qb.where('product.sellerId = :sellerId', { sellerId: user.sub });
    }
    // admin: no filter

    qb.orderBy('order.id', 'ASC').skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
      data,
      meta: { total, page, limit, totalPages },
    };
  }

  async findOrderById(id: number, user: JwtPayload): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        user: true,
        orderItems: { product: true },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const ability = this.caslAbilityFactory.createForUser(user);

    if (user.role === UserRole.SELLER) {
      const ownsSomething = order.orderItems.some(
        (item) => item.product?.sellerId === user.sub,
      );
      if (!ownsSomething) {
        throw new ForbiddenException('You do not have access to this order');
      }
    } else if (!ability.can(Action.Read, order)) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  async checkout(user: JwtPayload): Promise<Order> {
    const cart = await this.cartService.getOrCreateCart(user.sub);

    if (!cart.cartItems || cart.cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;

      // Acquire pessimistic lock on each product row to prevent race conditions
      const lockedProducts: Product[] = [];
      for (const cartItem of cart.cartItems) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: cartItem.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${cartItem.productId} not found`,
          );
        }

        if (product.stock < cartItem.quantity) {
          throw new BadRequestException(
            `Product "${product.name}" does not have enough stock (available: ${product.stock}, requested: ${cartItem.quantity})`,
          );
        }

        lockedProducts.push(product);
      }

      // Compute total and deduct stock
      for (let i = 0; i < cart.cartItems.length; i++) {
        const cartItem = cart.cartItems[i];
        const product = lockedProducts[i];
        totalAmount += parseFloat(product.price) * cartItem.quantity;
        product.stock -= cartItem.quantity;
        await queryRunner.manager.save(Product, product);
      }

      // Create order
      const order = queryRunner.manager.create(Order, {
        userId: user.sub,
        status: OrderStatus.PENDING,
        totalAmount: totalAmount.toFixed(2),
      });
      const savedOrder = await queryRunner.manager.save(Order, order);

      // Create order items
      for (let i = 0; i < cart.cartItems.length; i++) {
        const cartItem = cart.cartItems[i];
        const product = lockedProducts[i];
        const orderItem = queryRunner.manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          priceAtOrder: product.price,
        });
        await queryRunner.manager.save(OrderItem, orderItem);
      }

      // Clear cart items
      await queryRunner.manager.delete(CartItem, { cartId: cart.id });

      await queryRunner.commitTransaction();

      this.logger.log(`Order #${savedOrder.id} created for user #${user.sub}`);
      return savedOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
