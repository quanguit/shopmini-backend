import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { ProductService } from '../product.service';
import { ProductDataLoader } from './product.dataloader';
import { ProductSearchArgs } from './product-search.args';
import {
  CategoryType,
  ProductConnection,
  ProductType,
  SellerType,
} from './product.types';

@Resolver(() => ProductType)
export class ProductResolver {
  constructor(
    private readonly productService: ProductService,
    private readonly dataLoader: ProductDataLoader,
  ) {}

  @Public()
  @Query(() => ProductConnection, { name: 'searchProducts' })
  async searchProducts(
    @Args() args: ProductSearchArgs,
  ): Promise<ProductConnection> {
    return this.productService.searchProducts(args);
  }

  // ResolveField: Resolve seller cho mỗi product (dùng DataLoader để batch)
  @ResolveField(() => SellerType, { nullable: true })
  async seller(@Parent() product: ProductType): Promise<SellerType | null> {
    const user = await this.dataLoader.sellerLoader.load(product.sellerId);

    if (!user) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    };
  }

  // ResolveField: Resolve category cho mỗi product (dùng DataLoader để batch)
  @ResolveField(() => CategoryType, { nullable: true })
  async category(@Parent() product: ProductType): Promise<CategoryType | null> {
    if (!product.categoryId) return null;

    const category = await this.dataLoader.categoryLoader.load(
      product.categoryId,
    );

    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
    };
  }
}
