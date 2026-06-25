import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from 'src/common/decorators/inject.decorator';
import { QueryFailedError, Repository } from 'typeorm';
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

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email: this.normalizeEmail(email) });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    const result = await this.userRepository.update(
      { id: userId },
      { password: hashedPassword },
    );

    if (!result.affected) {
      throw new NotFoundException('User not found');
    }
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
