import { registerAs } from '@nestjs/config';
import { IsInt, IsString, Max, Min } from 'class-validator';
import { validateConfig } from 'src/utils/validate-config';

class DatabaseVariablesValidator {
  @IsString()
  DB_HOST: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  DB_PORT: number;

  @IsString()
  DB_NAME: string;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;
}

export type DatabaseConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
};

export const databaseConfig = registerAs<DatabaseConfig>('database', () => {
  validateConfig(DatabaseVariablesValidator, process.env);

  return {
    type: process.env.DB_CONNECTION,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  };
});
