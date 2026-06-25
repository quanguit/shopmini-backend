import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { RegisterDto } from './dtos/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Limit registration attempts to 5 per minute
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    return this.authService.loginWithCredentials(
      loginDto.email,
      loginDto.password,
    );
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() req: Request & { user: JwtPayload },
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<void> {
    await this.authService.logout(req.user.sub, refreshTokenDto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(204)
  async logoutAll(@Req() req: Request & { user: JwtPayload }): Promise<void> {
    await this.authService.logoutAll(req.user.sub);
  }

  @Post('change-password')
  @HttpCode(204)
  async changePassword(
    @Req() req: Request & { user: JwtPayload },
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(
      req.user.sub,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }
}
