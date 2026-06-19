import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './database/config/database.config';
import { DataBaseModule } from './database/database.module';
import { CartDetailModule } from './modules/cart-detail/cart-detail.module';
import { CartModule } from './modules/cart/cart.module';
import { CategoryModule } from './modules/category/category.module';
import { NotificationModule } from './modules/notification/notification.module';
import { OrderDetailModule } from './modules/order-detail/order-detail.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ProductModule } from './modules/product/product.module';
import { ReviewModule } from './modules/review/review.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    DataBaseModule,
    CartModule,
    CartDetailModule,
    CategoryModule,
    NotificationModule,
    OrderModule,
    OrderDetailModule,
    PaymentModule,
    ProductModule,
    ReviewModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
