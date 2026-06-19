import { Module } from '@nestjs/common';
import { CartDetailController } from './cart-detail.controller';
import { CartDetailService } from './cart-detail.service';

@Module({
  controllers: [CartDetailController],
  providers: [CartDetailService],
})
export class CartDetailModule {}
