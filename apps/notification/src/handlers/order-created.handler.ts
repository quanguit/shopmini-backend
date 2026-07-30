import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NOTIFICATION_PATTERNS } from 'src/modules/notification/constants/notification-patterns';
import { NotificationService } from 'src/modules/notification/notification.service';

export interface OrderCreatedPayload {
  orderId: number;
  userId: number;
  totalAmount: string;
}

@Controller()
export class OrderCreatedMicroserviceHandler {
  private readonly logger = new Logger(OrderCreatedMicroserviceHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern(NOTIFICATION_PATTERNS.ORDER_CREATED)
  async handle(@Payload() data: OrderCreatedPayload): Promise<void> {
    this.logger.log(
      `[Notification] Received order.created for order #${data.orderId}, user #${data.userId}`,
    );

    await this.notificationService.createNotification({
      userId: data.userId,
      type: 'order_created',
      payload: [{ orderId: data.orderId, totalAmount: data.totalAmount }],
    });

    // FR3.4 — Simulated email confirmation
    this.logger.log(
      `[Notification] Email sent to user #${data.userId}: "Your order #${data.orderId} has been placed (total: ${data.totalAmount})"`,
    );
  }
}
