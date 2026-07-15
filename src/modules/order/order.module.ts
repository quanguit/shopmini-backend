import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_DATA_SOURCE_NAME } from 'src/database/constants/data-source';
import { CaslAbilityFactory } from '../auth/casl/casl-ability.factory';
import { CartModule } from '../cart/cart.module';
import { ProductModule } from '../product/product.module';
import { Order } from './entities/order.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order], APP_DATA_SOURCE_NAME),
    CartModule,
    ProductModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, CaslAbilityFactory],
  exports: [OrderService],
})
export class OrderModule {}
