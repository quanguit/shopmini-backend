import { BaseEntity } from 'src/common/entities/base.entity';
import { TABLE_NAMES } from 'src/database/constants/table-names';
import { Cart } from 'src/modules/cart/entities/cart.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CART_DETAIL_COLUMNS } from '../constants/cart-detail.constant';

@Entity({ name: TABLE_NAMES.CART_DETAIL })
export class CartDetail extends BaseEntity {
  @Column({ name: CART_DETAIL_COLUMNS.cartId })
  cartId: number;

  @Column({ name: CART_DETAIL_COLUMNS.productId })
  productId: number;

  @Column({ name: CART_DETAIL_COLUMNS.quantity })
  quantity: number;

  // N—1: Cart
  @ManyToOne(() => Cart, (cart) => cart.cartDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: CART_DETAIL_COLUMNS.cartId })
  cart: Cart;

  // N—1: Product
  @ManyToOne(() => Product, (product) => product.cartDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: CART_DETAIL_COLUMNS.productId })
  product: Product;
}
