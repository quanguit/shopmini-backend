import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { RoleGuard } from '../auth/guards/role.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../user/enums/user-role.enum';
import { CartItemService } from './cart-item.service';
import { CreateCartItemDto } from './dtos/create-cart-item.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';
import { CartItem } from './entities/cart-item.entity';

@Controller('cart/items')
@UseGuards(RoleGuard)
@Roles(UserRole.CUSTOMER)
export class CartItemController {
  constructor(private readonly cartItemService: CartItemService) {}

  @Post()
  async createCartItem(
    @Body() dto: CreateCartItemDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CartItem> {
    return this.cartItemService.createCartItem(user.sub, dto);
  }

  @Patch(':id')
  async updateCartItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CartItem> {
    return this.cartItemService.updateCartItem(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async removeCartItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.cartItemService.removeCartItem(id, user.sub);
  }
}
