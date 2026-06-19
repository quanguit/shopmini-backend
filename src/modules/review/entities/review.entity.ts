import { BaseEntity } from 'src/common/entities/base.entity';
import { TABLE_NAMES } from 'src/database/constants/table-names';
import { Product } from 'src/modules/product/entities/product.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { REVIEW_COLUMNS } from '../constants/review.constant';

@Entity({ name: TABLE_NAMES.REVIEW })
@Check(`"${REVIEW_COLUMNS.rating}" >= 1 AND "${REVIEW_COLUMNS.rating}" <= 5`)
export class Review extends BaseEntity {
  @Column({ name: REVIEW_COLUMNS.productId })
  productId: number;

  @Column({ name: REVIEW_COLUMNS.userId })
  userId: number;

  @Column({ name: REVIEW_COLUMNS.rating })
  rating: number;

  @Column({ name: REVIEW_COLUMNS.comment })
  comment: string;

  // N—1: Product
  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: REVIEW_COLUMNS.productId })
  product: Product;

  // N—1: User
  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: REVIEW_COLUMNS.userId })
  user: User;
}
