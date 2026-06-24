import { UserRole } from 'src/modules/user/enums/user-role.enum';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}
