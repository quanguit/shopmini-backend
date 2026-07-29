import { IEvent } from '@nestjs/cqrs';
import { Order } from '../entities/order.entity';

export class OrderCreatedEvent implements IEvent {
  constructor(public readonly order: Order) {}
}
