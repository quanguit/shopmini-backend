import {
  InjectDataSource as NestInjectDataSource,
  InjectRepository as NestInjectRepository,
} from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { APP_DATA_SOURCE_NAME } from 'src/database/constants/data-source';

export function InjectRepository(entity: EntityClassOrSchema) {
  return NestInjectRepository(entity, APP_DATA_SOURCE_NAME);
}

export function InjectDataSource() {
  return NestInjectDataSource(APP_DATA_SOURCE_NAME);
}
