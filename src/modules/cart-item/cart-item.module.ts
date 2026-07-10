import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_DATA_SOURCE_NAME } from 'src/database/constants/data-source';
import { CartModule } from '../cart/cart.module';
import { ProductModule } from '../product/product.module';
import { CartItemController } from './cart-item.controller';
import { CartItemService } from './cart-item.service';
import { CartItem } from './entities/cart-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartItem], APP_DATA_SOURCE_NAME),
    CartModule,
    ProductModule,
  ],
  controllers: [CartItemController],
  providers: [CartItemService],
})
export class CartItemModule {}
