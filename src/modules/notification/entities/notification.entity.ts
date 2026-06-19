import { BaseEntity } from 'src/common/entities/base.entity';
import { TABLE_NAMES } from 'src/database/constants/table-names';
import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { NOTIFICATION_COLUMNS } from '../constants/notification.constant';

@Entity({ name: TABLE_NAMES.NOTIFICATION })
export class Notification extends BaseEntity {
  @Column({ name: NOTIFICATION_COLUMNS.userId })
  userId: number;

  @Column({ name: NOTIFICATION_COLUMNS.type })
  type: string;

  @Column({
    name: NOTIFICATION_COLUMNS.payload,
    type: 'jsonb',
    default: () => "'[]'",
  })
  payload: Record<string, any>[];

  @Column({
    name: NOTIFICATION_COLUMNS.readAt,
    type: 'timestamp',
    nullable: true,
  })
  readAt?: Date | null;

  // N—1: User
  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: NOTIFICATION_COLUMNS.userId,
  })
  user: User;
}
