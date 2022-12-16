import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import {
  KAFKA_HEALTHCHECK_FAILED,
  kafkaHealthCheckOptions,
} from 'app/module/kafka';

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  async pingCheck(
    key: string,
    options: kafkaHealthCheckOptions,
  ): Promise<HealthIndicatorResult> {
    const isHealthy = await options.client.checkHealth();
    const result = this.getStatus(key, isHealthy);

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError(KAFKA_HEALTHCHECK_FAILED, result);
  }
}
