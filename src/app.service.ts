import { Inject, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { APP_DATA_SOURCE } from './database/constants/data-source';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @Inject(APP_DATA_SOURCE)
    private readonly dataSource: DataSource,
  ) {}

  async checkHealth(): Promise<{ status: string; database: string }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      this.logger.error('Database connection failed', error);
      return { status: 'ok', database: 'disconnected' };
    }
  }
}
