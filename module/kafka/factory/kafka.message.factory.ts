import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { FactoryInterface } from 'core/base/interface';
import {
  CreateKafkaMessageDto,
  KafkaMessageDto,
  kafkaMessageOptions,
} from 'app/module/kafka';
import { DateService } from 'app/service';
import { ClassConstructor, plainToClass } from 'class-transformer';

@Injectable()
export class KafkaMessageFactory implements FactoryInterface {
  create<T>(
    dtoClass: ClassConstructor<KafkaMessageDto<T>>,
    dtoData: {
      data: CreateKafkaMessageDto<T>;
      options: kafkaMessageOptions;
    }[],
  ): KafkaMessageDto<T>[] {
    return dtoData.map((data) => this.createOne<T>(dtoClass, data));
  }

  createOne<T>(
    dtoClass: ClassConstructor<KafkaMessageDto<T>>,
    dtoData: {
      data: CreateKafkaMessageDto<T>;
      options: kafkaMessageOptions;
    },
  ): KafkaMessageDto<T> {
    const traceId = nanoid();
    const dateNow = DateService.getUtcDate();
    return plainToClass(dtoClass, {
      traceId,
      requestId: dtoData.options?.isClientRequest ? nanoid() : null,
      responseTo: `${dtoData.data.topic}.response.${traceId}`,
      timestamp: DateService.getUtcTimestamp(dateNow),
      dateTime: DateService.getUtcIso(dateNow),
      data: null,
      error: null,
      ...dtoData.data,
    });
  }
}
