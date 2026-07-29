import { registerAs } from '@nestjs/config';
import { IsInt, IsString, Max, Min } from 'class-validator';
import { validateConfig } from 'src/utils/validate-config';

class RedisVariablesValidator {
  @IsString()
  REDIS_HOST: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  REDIS_PORT: number;
}

export type RedisConfig = {
  host: string;
  port: number;
};

export const redisConfig = registerAs<RedisConfig>('redis', () => {
  validateConfig(RedisVariablesValidator, process.env);

  return {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
  };
});
