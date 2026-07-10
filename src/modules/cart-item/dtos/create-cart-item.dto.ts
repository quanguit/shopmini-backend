import { IsInt, IsPositive, Min } from 'class-validator';

export class CreateCartItemDto {
  @IsInt()
  @IsPositive()
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}
