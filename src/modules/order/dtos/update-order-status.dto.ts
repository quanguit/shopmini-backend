import { IsEnum } from 'class-validator';
import { OrderStatus } from '../enums/order.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
