import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { RoleGuard } from '../auth/guards/role.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../user/enums/user-role.enum';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';

@Controller('cart')
@UseGuards(RoleGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAllCarts(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Cart>> {
    return this.cartService.findAllCarts(paginationDto);
  }

  @Get('/my-cart')
  @Roles(UserRole.CUSTOMER)
  async getOrCreateCart(@CurrentUser() user: JwtPayload): Promise<Cart> {
    return this.cartService.getOrCreateCart(user.sub);
  }
}
