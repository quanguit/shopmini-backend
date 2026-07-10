import { BaseEntity } from 'src/common/entities/base.entity';
import { TABLE_NAMES } from 'src/database/constants/table-names';
import { Cart } from 'src/modules/cart/entities/cart.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CART_ITEM_COLUMNS } from '../constants/cart-item.constant';

@Entity({ name: TABLE_NAMES.CART_ITEM })
export class CartItem extends BaseEntity {
  @Column({ name: CART_ITEM_COLUMNS.cartId })
  cartId: number;

  @Column({ name: CART_ITEM_COLUMNS.productId })
  productId: number;

  @Column({ name: CART_ITEM_COLUMNS.quantity })
  quantity: number;

  // N—1: Cart
  @ManyToOne(() => Cart, (cart) => cart.cartItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: CART_ITEM_COLUMNS.cartId })
  cart: Cart;

  // N—1: Product
  @ManyToOne(() => Product, (product) => product.cartItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: CART_ITEM_COLUMNS.productId })
  product: Product;
}
