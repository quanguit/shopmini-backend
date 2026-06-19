import { BaseEntity } from 'src/common/entities/base.entity';
import { TABLE_NAMES } from 'src/database/constants/table-names';
import { OrderDetail } from 'src/modules/order-detail/entities/order-detail.entity';
import { Payment } from 'src/modules/payment/entities/payment.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ORDER_COLUMNS } from '../constants/order.constant';
import { OrderStatus } from '../enums/order.enum';

@Entity({ name: TABLE_NAMES.ORDER })
export class Order extends BaseEntity {
  @Column({ name: ORDER_COLUMNS.userId })
  userId: number;

  @Column({
    name: ORDER_COLUMNS.status,
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    name: ORDER_COLUMNS.totalAmount,
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  totalAmount: string;

  // N—1: User
  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: ORDER_COLUMNS.userId })
  user: User;

  // 1—N: OrderDetail
  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order)
  orderDetails: OrderDetail[];

  // 1—1: Payment (Payment is the owning side of the foreign key)
  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment;
}
