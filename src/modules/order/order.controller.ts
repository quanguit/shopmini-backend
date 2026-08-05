import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { RoleGuard } from '../auth/guards/role.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../user/enums/user-role.enum';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { OrderService } from './order.service';

@Controller('orders')
@UseGuards(RoleGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async findAllOrders(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.findAllOrders(paginationDto, user);
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async findOrderById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.findOrderById(id, user);
  }

  @Post('checkout')
  @Roles(UserRole.CUSTOMER)
  async checkout(@CurrentUser() user: JwtPayload) {
    return this.orderService.checkout(user);
  }

  @Patch(':id/status')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.updateOrderStatus(id, dto, user);
  }
}
