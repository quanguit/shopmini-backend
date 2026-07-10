import { Controller } from '@nestjs/common';
import { OrderItemService } from './order-item.service';

@Controller('order')
export class OrderItemController {
  constructor(private readonly orderItemService: OrderItemService) {}
}
