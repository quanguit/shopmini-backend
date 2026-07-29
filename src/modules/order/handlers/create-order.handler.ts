import {
  BadRequestException,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { APP_DATA_SOURCE_TOKEN } from 'src/database/constants/data-source';
import { CartItem } from 'src/modules/cart-item/entities/cart-item.entity';
import { CartService } from 'src/modules/cart/cart.service';
import { OrderItem } from 'src/modules/order-item/entities/order-item.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { DataSource } from 'typeorm';
import { CreateOrderCommand } from '../commands/create-order.command';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../enums/order.enum';
import { OrderCreatedEvent } from '../events/order-created.event';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  private readonly logger = new Logger(CreateOrderHandler.name);

  constructor(
    @Inject(APP_DATA_SOURCE_TOKEN)
    private readonly dataSource: DataSource,
    private readonly cartService: CartService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateOrderCommand): Promise<Order> {
    const { userId } = command;

    const cart = await this.cartService.getOrCreateCart(userId);

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
        userId,
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

      this.logger.log(`Order #${savedOrder.id} created for user #${userId}`);
      this.eventBus.publish(new OrderCreatedEvent(savedOrder));
      return savedOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
