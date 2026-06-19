import { BaseEntity } from 'src/common/entities/base.entity';
import { TABLE_NAMES } from 'src/database/constants/table-names';
import { Order } from 'src/modules/order/entities/order.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ORDER_DETAIL_COLUMNS } from '../constants/order-detail.constant';

@Entity({ name: TABLE_NAMES.ORDER_DETAIL })
export class OrderDetail extends BaseEntity {
  @Column({ name: ORDER_DETAIL_COLUMNS.orderId })
  orderId: number;

  @Column({ name: ORDER_DETAIL_COLUMNS.productId })
  productId: number;

  @Column({ name: ORDER_DETAIL_COLUMNS.quantity })
  quantity: number;

  @Column({
    name: ORDER_DETAIL_COLUMNS.priceAtOrder,
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  priceAtOrder: string;

  // N—1: Order
  @ManyToOne(() => Order, (order) => order.orderDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: ORDER_DETAIL_COLUMNS.orderId })
  order: Order;

  // N—1: Product
  @ManyToOne(() => Product, (product) => product.orderDetails, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: ORDER_DETAIL_COLUMNS.productId })
  product?: Product | null;
}
