import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';
import { ProductStatus } from '../enums/product.enum';

export class CreateProductDto {
  @IsPositive()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNumberString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Price must have at most 2 decimal places',
  })
  price: string;

  @IsPositive()
  stock: number;

  @IsUrl({}, { each: true })
  @IsArray()
  @IsOptional()
  images: string[];

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus = ProductStatus.DRAFT;
}
