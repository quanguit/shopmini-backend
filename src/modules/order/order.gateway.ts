import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { InjectRepository } from 'src/common/decorators/inject.decorator';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../user/enums/user-role.enum';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/order.enum';
import type { AuthenticatedSocket } from './types/socket.types';

@WebSocketGateway({ namespace: '/orders', cors: { origin: '*' } })
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  handleConnection(client: AuthenticatedSocket): void {
    try {
      const token =
        (client.handshake.auth as { token?: string }).token ??
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) throw new WsException('Missing token');

      const payload = this.jwtService.verify<JwtPayload>(token);
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    client.rooms.forEach((room) => void client.leave(room));
  }

  @SubscribeMessage('joinOrderRoom')
  async handleJoinOrderRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: number },
  ): Promise<{ event: string; data: string }> {
    const user: JwtPayload = client.data.user;
    const order = await this.orderRepository.findOne({
      where: { id: data.orderId },
      relations: { orderItems: { product: true } },
    });

    if (!order) {
      throw new WsException(`Order ${data.orderId} not found`);
    }

    const hasAccess = this.canAccessOrder(user, order);
    if (!hasAccess) {
      throw new WsException('Forbidden');
    }

    const room = `order:${data.orderId}`;
    await client.join(room);
    return { event: 'joinedRoom', data: room };
  }

  /** Called by OrderService after a status update to broadcast to room members */
  notifyStatusChange(orderId: number, status: OrderStatus): void {
    this.server
      .to(`order:${orderId}`)
      .emit('orderStatusChanged', { orderId, status });
  }

  private canAccessOrder(user: JwtPayload, order: Order): boolean {
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.CUSTOMER) return order.userId === user.sub;
    if (user.role === UserRole.SELLER) {
      return order.orderItems.some(
        (item) => item.product?.sellerId === user.sub,
      );
    }
    return false;
  }
}
