import { Command } from '@nestjs/cqrs';
import { Order } from '../entities/order.entity';

export class CreateOrderCommand extends Command<Order> {
  constructor(public readonly userId: number) {
    super();
  }
}
