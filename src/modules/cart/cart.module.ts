import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_DATA_SOURCE_NAME } from 'src/database/constants/data-source';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart], APP_DATA_SOURCE_NAME)],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
