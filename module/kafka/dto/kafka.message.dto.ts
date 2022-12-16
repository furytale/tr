import { CreateKafkaMessageDto } from 'module/kafka/dto/create.kafka.message.dto';

export class KafkaMessageDto<T> extends CreateKafkaMessageDto<T> {
  traceId: string;
  requestId?: string;
  responseTo: string;
  timestamp: number;
  dateTime: string;
}
