import { BaseEntity } from 'src/common/entities/base.entity';
import { TABLE_NAMES } from 'src/database/constants/table-names';
import { CartItem } from 'src/modules/cart-item/entities/cart-item.entity';
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

  // 1—N: CartItem
  @OneToMany(() => CartItem, (cartItem) => cartItem.cart)
  cartItems: CartItem[];
}
