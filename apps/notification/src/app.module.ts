import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from 'src/database/config/database.config';
import { DataBaseModule } from 'src/database/database.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { OrderCreatedMicroserviceHandler } from './handlers/order-created.handler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    DataBaseModule,
    NotificationModule,
  ],
  providers: [OrderCreatedMicroserviceHandler],
})
export class NotificationAppModule {}
