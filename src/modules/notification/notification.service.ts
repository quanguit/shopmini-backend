import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from 'src/common/decorators/inject.decorator';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(data);
    const saved = await this.notificationRepository.save(notification);
    this.logger.log(
      `Notification #${saved.id} created for user #${data.userId} (type: ${data.type})`,
    );
    return saved;
  }
}
