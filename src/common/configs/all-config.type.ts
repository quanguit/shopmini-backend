import { DatabaseConfig } from 'src/database/config/database-config.type';
import { JwtConfig } from './jwt.config';

export type AllConfig = {
  database: DatabaseConfig;
  jwt: JwtConfig;
};
