import { UserRole } from 'src/modules/user/enums/user-role.enum';

export const DEFAULT_USER_ROLE = UserRole.CUSTOMER;

export const ALLOWED_REGISTER_ROLES = [
  UserRole.SELLER,
  UserRole.CUSTOMER,
] as const;
