import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AllConfig } from 'src/common/configs/all-config.type';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../user/enums/user-role.enum';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dtos/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfig>,
  ) {}

  private async signTokens(
    payload: JwtPayload,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('jwt.secret', { infer: true }),
        expiresIn: this.configService.getOrThrow('jwt.expiresIn', {
          infer: true,
        }),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('jwt.refreshSecret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow('jwt.refreshExpiresIn', {
          infer: true,
        }),
      }),
    ]);

    return { access_token, refresh_token };
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const { password, ...userData } = registerDto;

    // Admin can only be created via seed — block at service layer as defense in depth
    if (userData.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot register as admin');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.userService.createUser({
      ...userData,
      role: userData.role ?? UserRole.CUSTOMER,
      password: hashedPassword,
    });
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userService.findUserByEmail(email);

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result; // return a valid user (which will be assigned to req.user).
      }
    }
    return null;
  }

  async login(
    user: Omit<User, 'password'>,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.signTokens(payload);
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string }> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow('jwt.refreshSecret', {
          infer: true,
        }),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findUserById(payload.sub);
    if (!user) throw new UnauthorizedException();

    const newPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = await this.jwtService.signAsync(newPayload, {
      secret: this.configService.getOrThrow('jwt.secret', { infer: true }),
      expiresIn: this.configService.getOrThrow('jwt.expiresIn', {
        infer: true,
      }),
    });

    return { access_token };
  }
}
