import { BaseEntity } from 'src/common/entities/base.entity';
import { TABLE_NAMES } from 'src/database/constants/table-names';
import { Product } from 'src/modules/product/entities/product.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CATEGORY_COLUMNS } from '../constants/category.constant';

@Entity({ name: TABLE_NAMES.CATEGORY })
export class Category extends BaseEntity {
  @Column({ name: CATEGORY_COLUMNS.name })
  name: string;

  @Column({ name: CATEGORY_COLUMNS.slug, unique: true })
  slug: string;

  @Column({ name: CATEGORY_COLUMNS.parentId, nullable: true })
  parentId?: number | null;

  // Self-reference: many child categories belong to one parent category
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: CATEGORY_COLUMNS.parentId })
  parent?: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  // 1—N: Product
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
