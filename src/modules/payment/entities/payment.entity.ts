import { BaseEntity } from 'src/common/entities/base.entity';
import { TABLE_NAMES } from 'src/database/constants/table-names';
import { Order } from 'src/modules/order/entities/order.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { PAYMENT_COLUMNS } from '../constants/payment.constant';
import { PaymentMethod, PaymentStatus } from '../enums/payment.enum';

@Entity({ name: TABLE_NAMES.PAYMENT })
export class Payment extends BaseEntity {
  @Column({ name: PAYMENT_COLUMNS.orderId })
  orderId: number;

  @Column({
    name: PAYMENT_COLUMNS.method,
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH_ON_DELIVERY,
  })
  method: PaymentMethod;

  @Column({
    name: PAYMENT_COLUMNS.status,
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    name: PAYMENT_COLUMNS.transactionRef,
    nullable: true,
  })
  transactionRef?: string;

  @Column({ name: PAYMENT_COLUMNS.paidAt, type: 'timestamp', nullable: true })
  paidAt?: Date | null;

  // 1—1: Order (Payment keeps FK order_id)
  @OneToOne(() => Order, (order) => order.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: PAYMENT_COLUMNS.orderId })
  order: Order;
}
