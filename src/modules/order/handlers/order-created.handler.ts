import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OrderCreatedEvent } from '../events/order-created.event';

@EventsHandler(OrderCreatedEvent)
export class SendNotificationHandler implements IEventHandler<OrderCreatedEvent> {
  private readonly logger = new Logger(SendNotificationHandler.name);

  handle(event: OrderCreatedEvent): void {
    const { order } = event;
    this.logger.log(
      `[OrderCreatedEvent] Order #${order.id} for user #${order.userId} — total: ${order.totalAmount}`,
    );
    // TODO FR3.3: send Notification microservice
  }
}
