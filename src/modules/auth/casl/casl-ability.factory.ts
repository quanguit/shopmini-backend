import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Order } from '../../order/entities/order.entity';
import { UserRole } from '../../user/enums/user-role.enum';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export enum Action {
  Manage = 'manage',
  Read = 'read',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

export type Subject = InferSubjects<typeof Order> | 'all';

export type AppAbility = MongoAbility<[Action, Subject]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: JwtPayload): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.role === UserRole.ADMIN) {
      can(Action.Manage, 'all');
    } else if (user.role === UserRole.CUSTOMER) {
      can(Action.Read, Order, { userId: user.sub });
    } else if (user.role === UserRole.SELLER) {
      // Seller can read orders — actual filtering happens in service layer
      can(Action.Read, Order);
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subject>,
    });
  }
}
