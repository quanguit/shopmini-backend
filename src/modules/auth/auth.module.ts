import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllConfig } from 'src/common/configs/all-config.type';
import { APP_DATA_SOURCE_NAME } from 'src/database/constants/data-source';
import { UserModule } from '../user/user.module';
import { User } from '../user/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    UserModule,
    PassportModule,
    TypeOrmModule.forFeature([User, RefreshToken], APP_DATA_SOURCE_NAME),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfig>) => ({
        secret: configService.getOrThrow('jwt.secret', {
          infer: true,
        }),
        signOptions: {
          expiresIn: configService.getOrThrow('jwt.expiresIn', {
            infer: true,
          }),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
