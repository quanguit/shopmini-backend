import { IsIn, IsOptional } from 'class-validator';
import { CreateUserDto } from 'src/modules/user/dtos/create-user.dto';
import { UserRole } from 'src/modules/user/enums/user-role.enum';
import {
  ALLOWED_REGISTER_ROLES,
  DEFAULT_USER_ROLE,
} from '../constants/role.constants';

export class RegisterDto extends CreateUserDto {
  @IsIn(ALLOWED_REGISTER_ROLES, {
    message: 'Role must be either seller or customer',
  })
  @IsOptional()
  role?: UserRole = DEFAULT_USER_ROLE;
}
