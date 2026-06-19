import { BaseEntity } from 'src/common/entities/base.entity';
import { TABLE_NAMES } from 'src/database/constants/table-names';
import { CartDetail } from 'src/modules/cart-detail/entities/cart-detail.entity';
import { Category } from 'src/modules/category/entities/category.entity';
import { OrderDetail } from 'src/modules/order-detail/entities/order-detail.entity';
import { Review } from 'src/modules/review/entities/review.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PRODUCT_COLUMNS } from '../constants/product.constant';
import { ProductStatus } from '../enums/product.enum';

@Entity({ name: TABLE_NAMES.PRODUCT })
export class Product extends BaseEntity {
  @Column({ name: PRODUCT_COLUMNS.sellerId })
  sellerId: number;

  @Column({ name: PRODUCT_COLUMNS.categoryId })
  categoryId: number;

  @Column({ name: PRODUCT_COLUMNS.name })
  name: string;

  @Column({ name: PRODUCT_COLUMNS.description })
  description: string;

  @Column({
    name: PRODUCT_COLUMNS.price,
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  price: string;

  @Column({ name: PRODUCT_COLUMNS.stock })
  stock: number;

  @Column({ name: PRODUCT_COLUMNS.images, array: true, default: [] })
  images: string[];

  @Column({
    name: PRODUCT_COLUMNS.status,
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  // N—1: User (seller)
  @ManyToOne(() => User, (user) => user.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: PRODUCT_COLUMNS.sellerId })
  seller: User;

  // N—1: Category
  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: PRODUCT_COLUMNS.categoryId })
  category?: Category | null;

  // 1—N: CartDetail
  @OneToMany(() => CartDetail, (cartDetail) => cartDetail.product)
  cartDetails: CartDetail[];

  // 1—N: OrderDetail
  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.product)
  orderDetails: OrderDetail[];

  // 1—N: Review
  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];
}
