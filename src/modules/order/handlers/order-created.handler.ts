import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ClientProxy } from '@nestjs/microservices';
import {
  NOTIFICATION_PATTERNS,
  NOTIFICATION_SERVICE,
} from 'src/modules/notification/constants/notification-patterns';
import { OrderCreatedEvent } from '../events/order-created.event';

@EventsHandler(OrderCreatedEvent)
export class OrderCreatedHandler implements IEventHandler<OrderCreatedEvent> {
  private readonly logger = new Logger(OrderCreatedHandler.name);

  constructor(
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
  ) {}

  handle(event: OrderCreatedEvent): void {
    const { order } = event;
    this.logger.log(
      `[OrderCreatedEvent] Order #${order.id} for user #${order.userId} — total: ${order.totalAmount}`,
    );

    // Fire-and-forget: order creation succeeds even if notification service is down
    this.notificationClient
      .emit(NOTIFICATION_PATTERNS.ORDER_CREATED, {
        orderId: order.id,
        userId: order.userId,
        totalAmount: order.totalAmount,
      })
      .subscribe({
        error: (err: Error) =>
          this.logger.warn(
            `Notification emit failed (non-blocking): ${err.message}`,
          ),
      });
  }
}
