import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { RoleGuard } from '../auth/guards/role.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../user/enums/user-role.enum';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';

@Controller('cart')
@UseGuards(RoleGuard)
@Roles(UserRole.CUSTOMER)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getOrCreateCart(@CurrentUser() user: JwtPayload): Promise<Cart> {
    return this.cartService.getOrCreateCart(user.sub);
  }
}
