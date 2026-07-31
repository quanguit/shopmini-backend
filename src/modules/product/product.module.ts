import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_DATA_SOURCE_NAME } from 'src/database/constants/data-source';
import { CategoryModule } from '../category/category.module';
import { UserModule } from '../user/user.module';
import { Product } from './entities/product.entity';
import { ProductDataLoader } from './graphql/product.dataloader';
import { ProductResolver } from './graphql/product.resolver';
import { OwnershipGuard } from './guards/ownership.guard';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product], APP_DATA_SOURCE_NAME),
    CategoryModule,
    UserModule,
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    OwnershipGuard,
    ProductResolver,
    ProductDataLoader,
  ],
  exports: [ProductService],
})
export class ProductModule {}
