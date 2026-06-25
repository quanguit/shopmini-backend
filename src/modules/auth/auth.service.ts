import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AllConfig } from 'src/common/configs/all-config.type';
import { InjectRepository } from 'src/common/decorators/inject.decorator';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../user/enums/user-role.enum';
import { UserService } from '../user/user.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dtos/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfig>,
  ) {}

  private buildJwtPayload(
    user: Pick<User, 'id' | 'email' | 'role'>,
  ): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRefreshTokenExpiry(refreshToken: string): Date {
    const decodedUnknown: unknown = this.jwtService.decode(refreshToken);

    if (!decodedUnknown || typeof decodedUnknown !== 'object') {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const decoded = decodedUnknown as { exp?: unknown };
    if (typeof decoded.exp !== 'number') {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    return new Date(decoded.exp * 1000);
  }

  private async signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow('jwt.secret', { infer: true }),
      expiresIn: this.configService.getOrThrow('jwt.expiresIn', {
        infer: true,
      }),
    });
  }

  private async createRefreshSession(
    user: Pick<User, 'id' | 'email' | 'role'>,
  ): Promise<{ token: string; tokenId: number }> {
    const tokenRecord = await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: user.id,
        tokenHash: '',
        expiresAt: new Date(),
        revokedAt: null,
        replacedByTokenId: null,
      }),
    );

    const refreshPayload: RefreshTokenPayload = {
      ...this.buildJwtPayload(user),
      tokenId: tokenRecord.id,
      type: 'refresh',
    };

    const token = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.getOrThrow('jwt.refreshSecret', {
        infer: true,
      }),
      expiresIn: this.configService.getOrThrow('jwt.refreshExpiresIn', {
        infer: true,
      }),
    });

    tokenRecord.tokenHash = this.hashRefreshToken(token);
    tokenRecord.expiresAt = this.getRefreshTokenExpiry(token);
    await this.refreshTokenRepository.save(tokenRecord);

    return { token, tokenId: tokenRecord.id };
  }

  private async issueTokenPair(
    user: Pick<User, 'id' | 'email' | 'role'>,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    refreshTokenId: number;
  }> {
    const payload = this.buildJwtPayload(user);
    const [access_token, refreshSession] = await Promise.all([
      this.signAccessToken(payload),
      this.createRefreshSession(user),
    ]);

    return {
      access_token,
      refresh_token: refreshSession.token,
      refreshTokenId: refreshSession.tokenId,
    };
  }

  private async verifyRefreshToken(
    refreshToken: string,
    ignoreExpiration = false,
  ): Promise<RefreshTokenPayload> {
    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow('jwt.refreshSecret', {
            infer: true,
          }),
          ignoreExpiration,
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh' || !payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    return payload;
  }

  private async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  private async rotateRefreshToken(
    tokenRecord: RefreshToken,
  ): Promise<{ token: string; tokenId: number }> {
    const rotated = await this.createRefreshSession(tokenRecord.user);
    tokenRecord.revokedAt = new Date();
    tokenRecord.replacedByTokenId = rotated.tokenId;
    await this.refreshTokenRepository.save(tokenRecord);

    return rotated;
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
    const tokenPair = await this.issueTokenPair(user);
    return {
      access_token: tokenPair.access_token,
      refresh_token: tokenPair.refresh_token,
    };
  }

  async loginWithCredentials(
    email: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.login(user);
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { id: payload.tokenId },
      relations: { user: true },
    });

    if (
      !tokenRecord ||
      !tokenRecord.user ||
      tokenRecord.userId !== payload.sub
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (
      tokenRecord.revokedAt ||
      tokenRecord.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Refresh token is no longer active');
    }

    if (tokenRecord.tokenHash !== this.hashRefreshToken(refreshToken)) {
      await this.revokeAllUserRefreshTokens(payload.sub);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.replacedByTokenId) {
      await this.revokeAllUserRefreshTokens(payload.sub);
      throw new UnauthorizedException('Refresh token already used');
    }

    const rotatedToken = await this.rotateRefreshToken(tokenRecord);
    const access_token = await this.signAccessToken(
      this.buildJwtPayload(tokenRecord.user),
    );

    return { access_token, refresh_token: rotatedToken.token };
  }

  async logout(userId: number, refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken, true);
    if (payload.sub !== userId) {
      throw new UnauthorizedException('Refresh token does not belong to user');
    }

    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('id = :tokenId', { tokenId: payload.tokenId })
      .andWhere('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  async logoutAll(userId: number): Promise<void> {
    await this.revokeAllUserRefreshTokens(userId);
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const isCurrentPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await this.userRepository.update(
      { id: userId },
      { password: hashedPassword },
    );
    if (!updated.affected) {
      throw new UnauthorizedException();
    }
    await this.revokeAllUserRefreshTokens(userId);
  }
}
