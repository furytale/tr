import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ExceptionInterface } from 'app/module';

export class CreateKafkaMessageDto<T> {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsOptional()
  data?: T;

  @IsOptional()
  error?: ExceptionInterface;
}
