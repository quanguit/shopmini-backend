import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllConfig } from 'src/common/configs/all-config.type';
import { APP_DATA_SOURCE_NAME } from 'src/database/constants/data-source';
import { CaslAbilityFactory } from '../auth/casl/casl-ability.factory';
import { CartModule } from '../cart/cart.module';
import { NOTIFICATION_SERVICE } from '../notification/constants/notification-patterns';
import { ProductModule } from '../product/product.module';
import { Order } from './entities/order.entity';
import { CreateOrderHandler } from './handlers/create-order.handler';
import { OrderCreatedHandler } from './handlers/order-created.handler';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order], APP_DATA_SOURCE_NAME),
    CartModule,
    ProductModule,
    ClientsModule.registerAsync([
      {
        name: NOTIFICATION_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService<AllConfig>) => {
          const host = configService.getOrThrow('redis.host', { infer: true });
          const port = configService.getOrThrow('redis.port', { infer: true });
          return {
            transport: Transport.REDIS,
            options: {
              host,
              port,
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    CaslAbilityFactory,
    CreateOrderHandler,
    OrderCreatedHandler,
  ],
  exports: [OrderService],
})
export class OrderModule {}
