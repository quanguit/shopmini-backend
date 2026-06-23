import { BaseEntity } from 'src/common/entities/base.entity';
import { TABLE_NAMES } from 'src/database/constants/table-names';
import { Cart } from 'src/modules/cart/entities/cart.entity';
import { Notification } from 'src/modules/notification/entities/notification.entity';
import { Order } from 'src/modules/order/entities/order.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { Review } from 'src/modules/review/entities/review.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { USER_COLUMNS } from '../constants/user.constants';
import { UserRole } from '../enums/user-role.enum';
import { Exclude } from 'class-transformer';

@Entity({ name: TABLE_NAMES.USER })
export class User extends BaseEntity {
  @Column({ name: USER_COLUMNS.email, unique: true })
  email: string;

  @Column({ name: USER_COLUMNS.password })
  @Exclude()
  password: string;

  @Column({ name: USER_COLUMNS.fullName })
  fullName: string;

  @Column({
    name: USER_COLUMNS.role,
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  // 1—N: Product (is seller)
  @OneToMany(() => Product, (product) => product.seller)
  products: Product[];

  // 1—N: Order
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  // 1—N: Cart
  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];

  // 1—N: Review
  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  // 1—N: Notification
  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
