import { getDataSourceToken } from '@nestjs/typeorm';

export const APP_DATA_SOURCE_NAME = 'APP_DATA_SOURCE_NAME';

export const APP_DATA_SOURCE_TOKEN = getDataSourceToken(APP_DATA_SOURCE_NAME);
