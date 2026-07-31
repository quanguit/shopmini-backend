import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from 'src/common/decorators/inject.decorator';
import { In, QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({
      email: this.normalizeEmail(email),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserById(id: number): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUsersByIds(ids: number[]): Promise<User[]> {
    if (ids.length === 0) return [];
    return this.userRepository.find({
      where: { id: In(ids) },
    });
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      ...data,
      email: this.normalizeEmail(data.email),
    });

    try {
      return await this.userRepository.save(user);
    } catch (error: unknown) {
      const driverCode =
        error instanceof QueryFailedError
          ? (error.driverError as { code?: string } | undefined)?.code
          : undefined;

      if (error instanceof QueryFailedError && driverCode === '23505') {
        throw new ConflictException('Email already in use');
      }

      throw new InternalServerErrorException('Cannot create user');
    }
  }
}
