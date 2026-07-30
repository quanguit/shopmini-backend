import { IsArray, IsInt, IsObject, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  userId: number;

  @IsString()
  type: string;

  @IsArray()
  @IsObject({ each: true })
  payload: Record<string, any>[];
}
