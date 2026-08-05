import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectRepository } from 'src/common/decorators/inject.decorator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { Repository } from 'typeorm';
import { Action, CaslAbilityFactory } from '../auth/casl/casl-ability.factory';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../user/enums/user-role.enum';
import { CreateOrderCommand } from './commands/create-order.command';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { Order } from './entities/order.entity';
import { OrderGateway } from './order.gateway';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private commandBus: CommandBus,
    private readonly orderGateway: OrderGateway,
  ) {}

  async findAllOrders(
    paginationDto: PaginationDto,
    user: JwtPayload,
  ): Promise<PaginatedResult<Order>> {
    const { page, limit } = paginationDto;
    const offset = (page - 1) * limit;

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product');

    if (user.role === UserRole.CUSTOMER) {
      qb.where('order.userId = :userId', { userId: user.sub });
    } else if (user.role === UserRole.SELLER) {
      qb.where('product.sellerId = :sellerId', { sellerId: user.sub });
    }
    // admin: no filter

    qb.orderBy('order.id', 'ASC').skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
      data,
      meta: { total, page, limit, totalPages },
    };
  }

  async findOrderById(id: number, user: JwtPayload): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        user: true,
        orderItems: { product: true },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const ability = this.caslAbilityFactory.createForUser(user);

    if (user.role === UserRole.SELLER) {
      const ownsSomething = order.orderItems.some(
        (item) => item.product?.sellerId === user.sub,
      );
      if (!ownsSomething) {
        throw new ForbiddenException('You do not have access to this order');
      }
    } else if (!ability.can(Action.Read, order)) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  async checkout(user: JwtPayload): Promise<Order> {
    return this.commandBus.execute(new CreateOrderCommand(user.sub));
  }

  async updateOrderStatus(
    id: number,
    dto: UpdateOrderStatusDto,
    user: JwtPayload,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { orderItems: { product: true } },
    });

    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);

    if (user.role === UserRole.SELLER) {
      const ownsSomething = order.orderItems.some(
        (item) => item.product?.sellerId === user.sub,
      );
      if (!ownsSomething) {
        throw new ForbiddenException('You do not have access to this order');
      }
    }

    order.status = dto.status;
    const saved = await this.orderRepository.save(order);
    this.orderGateway.notifyStatusChange(id, dto.status);
    return saved;
  }
}
