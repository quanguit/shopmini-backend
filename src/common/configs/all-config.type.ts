import { DatabaseConfig } from 'src/database/config/database.config';
import { JwtConfig } from './jwt.config';
import { RedisConfig } from './redis.config';

export type AllConfig = {
  database: DatabaseConfig;
  jwt: JwtConfig;
  redis: RedisConfig;
};
