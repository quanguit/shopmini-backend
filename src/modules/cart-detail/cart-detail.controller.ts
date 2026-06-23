import { Controller } from '@nestjs/common';
import { CartDetailService } from './cart-detail.service';

@Controller('carts')
export class CartDetailController {
  constructor(private readonly cartDetailService: CartDetailService) {}
}
