import { ArgsType, Field, Float, Int, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ProductSortField {
  PRICE = 'price',
  CREATED_AT = 'createdAt',
  NAME = 'name',
}
registerEnumType(ProductSortField, { name: 'ProductSortField' });

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}
registerEnumType(SortDirection, { name: 'SortDirection' });

@ArgsType()
export class ProductSearchArgs {
  // === FILTER OPTIONS ===
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  maxPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  keyword?: string;

  // === SORT OPTIONS ===

  @Field(() => ProductSortField, {
    defaultValue: ProductSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ProductSortField)
  sortBy: ProductSortField = ProductSortField.CREATED_AT;

  @Field(() => SortDirection, {
    defaultValue: SortDirection.DESC,
  })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.DESC;

  // === CURSOR PAGINATION ===

  @Field(() => Int, { defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  first: number = 10;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  after?: string;
}
