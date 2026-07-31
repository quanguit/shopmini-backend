import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

// === PRODUCT TYPE ===
// GraphQL type cho Product - không include seller/category trực tiếp
// Các field này sẽ được resolve riêng qua @ResolveField + DataLoader
@ObjectType()
export class ProductType {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  sellerId: number;

  @Field(() => Int, { nullable: true })
  categoryId?: number | null;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  stock: number;

  @Field(() => [String])
  images: string[];

  @Field()
  status: string;

  @Field()
  createdAt: Date;
}

// === NESTED TYPES (resolved via DataLoader) ===

@ObjectType()
export class SellerType {
  @Field(() => Int)
  id: number;

  @Field()
  fullName: string;

  @Field()
  email: string;
}

@ObjectType()
export class CategoryType {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;
}

// === CURSOR PAGINATION TYPES (Relay-style) ===

@ObjectType()
export class PageInfo {
  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => Boolean)
  hasPreviousPage: boolean;

  @Field({ nullable: true })
  startCursor?: string;

  @Field({ nullable: true })
  endCursor?: string;
}

@ObjectType()
export class ProductEdge {
  @Field()
  cursor: string;

  @Field(() => ProductType)
  node: ProductType;
}

@ObjectType()
export class ProductConnection {
  @Field(() => [ProductEdge])
  edges: ProductEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}
