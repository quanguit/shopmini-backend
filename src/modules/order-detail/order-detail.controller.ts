import { Controller } from '@nestjs/common';
import { OrderDetailService } from './order-detail.service';

@Controller('order-details')
export class OrderDetailController {
  constructor(private orderDetailService: OrderDetailService) {}
}
