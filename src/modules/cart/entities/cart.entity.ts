import { BaseEntity } from 'src/common/entities/base.entity';
import { TABLE_NAMES } from 'src/database/constants/table-names';
import { CartDetail } from 'src/modules/cart-detail/entities/cart-detail.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CART_COLUMNS } from '../constants/cart.constant';

@Entity({ name: TABLE_NAMES.CART })
export class Cart extends BaseEntity {
  @Column({ name: CART_COLUMNS.userId })
  userId: number;

  // N—1: User
  @ManyToOne(() => User, (user) => user.carts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: CART_COLUMNS.userId })
  user: User;

  // 1—N: CartDetail
  @OneToMany(() => CartDetail, (cartDetail) => cartDetail.cart)
  cartDetails: CartDetail[];
}
