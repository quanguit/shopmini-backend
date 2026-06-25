import { BaseEntity } from 'src/common/entities/base.entity';
import { TABLE_NAMES } from 'src/database/constants/table-names';
import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { REFRESH_TOKEN_COLUMNS } from '../constants/refresh-token.constants';

@Entity({ name: TABLE_NAMES.REFRESH_TOKEN })
export class RefreshToken extends BaseEntity {
  @Column({ name: REFRESH_TOKEN_COLUMNS.userId })
  userId: number;

  @Column({ name: REFRESH_TOKEN_COLUMNS.tokenHash })
  tokenHash: string;

  @Column({ name: REFRESH_TOKEN_COLUMNS.expiresAt, type: 'timestamp' })
  expiresAt: Date;

  @Column({
    name: REFRESH_TOKEN_COLUMNS.revokedAt,
    type: 'timestamp',
    nullable: true,
  })
  revokedAt: Date | null;

  @Column({
    name: REFRESH_TOKEN_COLUMNS.replacedByTokenId,
    type: 'integer',
    nullable: true,
  })
  replacedByTokenId: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: REFRESH_TOKEN_COLUMNS.userId })
  user: User;
}
