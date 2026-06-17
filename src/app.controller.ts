import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(private readonly appService: AppService) {}

  @Get('health')
  async checkHealth() {
    this.logger.debug('Health check endpoint called');
    return this.appService.checkHealth();
  }
}
