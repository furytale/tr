import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  UnprocessableEntityException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Admin, Consumer, Kafka, logLevel, Message } from 'kafkajs';
import { deserializeError } from 'serialize-error';
import { errorCodes } from 'app/enum';
import {
  CreateKafkaMessageDto,
  KafkaMessageDto,
  KafkaMessageFactory,
  kafkaMessageOptions,
  kafkaModuleOptions,
  subscriptions,
} from 'app/module/kafka';
import { DateService, Logger } from 'app/service';
import { withTimeoutException } from 'app/util';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private admin: Admin;
  private consumer: Consumer;
  private readonly timeout: number;
  private lastHeartbeatTimestamp: number;

  constructor(
    @Inject('KafkaModuleOptionsInterface')
    private readonly options: kafkaModuleOptions,
    @Inject('KafkaMessageFactoryInterface')
    private readonly factory: KafkaMessageFactory,
    private readonly logger: Logger,
  ) {
    const { client, consumer, timeout } = this.options;

    this.kafka = new Kafka({
      ...client,
      logLevel: logLevel.ERROR,
      logCreator: () => {
        return ({ namespace, log }) => {
          const { message, ...extra } = log;
          this.logger.log({
            namespace,
            message,
            extra,
          });
        };
      },
    });

    this.admin = this.kafka.admin();
    this.consumer = this.kafka.consumer(consumer);

    this.timeout = timeout || 30000;
  }

  async onModuleInit(): Promise<void> {
    await this.admin.connect();
    await this.consumer.connect();

    // Update `lastHeartbeatTimestamp` for HealthCheck
    this.consumer.on(
      this.consumer.events.HEARTBEAT,
      ({ timestamp }) => (this.lastHeartbeatTimestamp = timestamp),
    );

    for (const [topic, { fromBeginning }] of subscriptions) {
      await this.subscribe(topic, fromBeginning);
    }
    await this.run();
  }

  /**
   * Shutdown hook listeners consume system resources, so they are disabled by default. To use shutdown hooks, you must enable listeners by calling enableShutdownHooks()
   * @see https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown
   */
  async onModuleDestroy(): Promise<void> {
    await this.admin.disconnect();
    await this.consumer.disconnect();
  }

  /**
   * Creates standardized Kafka message
   * @param {CreateKafkaMessageDto<T>} data
   * @param {kafkaMessageOptions} options
   * @returns {KafkaMessageDto<T>}
   */
  public async createMessage<T>(
    data: CreateKafkaMessageDto<T>,
    options?: kafkaMessageOptions,
  ): Promise<KafkaMessageDto<T>> {
    await this.validateMessage<T>(data, CreateKafkaMessageDto);

    return this.factory.createOne(KafkaMessageDto, {
      data,
      options,
    });
  }

  /**
   * Sends Kafka message
   * @param {KafkaMessageDto<T>} message
   * @param {Omit<Message, 'value'>} options
   */
  public async sendMessage<T>(
    message: KafkaMessageDto<T>,
    options: Omit<Message, 'value'> = {},
  ): Promise<void> {
    const messageValue = this.serialize<T>(message);

    const producer = this.kafka.producer();

    try {
      await producer.connect();

      await producer.send({
        topic: message.topic,
        messages: [{ ...options, value: messageValue }],
      });
    } finally {
      await producer.disconnect();
    }
  }

  /**
   * Sends Kafka message & awaits for response from consumer
   * @param {KafkaMessageDto<T>} message
   * @param {Omit<Message, 'value'>} options
   * @returns {KafkaMessageDto<T>}
   */
  public async syncMessage<T, R>(
    message: KafkaMessageDto<T>,
    options: Omit<Message, 'value'> = {},
  ): Promise<KafkaMessageDto<R>> {
    const consumer = this.kafka.consumer({
      groupId: message.responseTo,
    });

    try {
      return await withTimeoutException<KafkaMessageDto<R>>(
        async (): Promise<KafkaMessageDto<R>> => {
          await consumer.connect();

          await this.admin.createTopics({
            topics: [{ topic: message.responseTo }],
          });

          await consumer.subscribe({
            topic: message.responseTo,
            fromBeginning: true,
          });

          await this.sendMessage(message, options);

          const result = await new Promise((resolve, reject) => {
            consumer.run({
              eachMessage: async ({ message }) => {
                const value = this.deserialize<T>(message.value);
                if (value.error) {
                  return reject(deserializeError(value.error));
                }
                return resolve(value);
              },
            });
          });

          return result as KafkaMessageDto<R>;
        },
      )(this.timeout, `Unable to reach topic<${message.topic}>.`);
    } finally {
      await consumer.disconnect();

      await this.admin.deleteTopics({
        topics: [message.responseTo],
      });
    }
  }

  /**
   * Check Kafka Health
   * @see {@link https://github.com/tulios/kafkajs/issues/452#issuecomment-517747429}
   * @returns {boolean}
   */
  public async checkHealth() {
    // Consumer has heartbeat within the session timeout, so it is healthy
    if (
      DateService.getUtcTimestamp() - this.lastHeartbeatTimestamp <
      this.timeout
    ) {
      return true;
    }

    // Consumer has not heartbeat, but maybe it's because the group is currently re-balancing
    try {
      const { state } = await this.consumer.describeGroup();

      return ['CompletingRebalance', 'PreparingRebalance'].includes(state);
    } catch {
      return false;
    }
  }

  /**
   * Validates Kafka message
   * @param {CreateKafkaMessageDto<T>} data
   * @param {typeof CreateKafkaMessageDto} dto
   */
  private async validateMessage<T>(
    data: CreateKafkaMessageDto<T>,
    dto: typeof CreateKafkaMessageDto,
  ): Promise<void> {
    const errors = await validate(
      plainToClass(dto, Object.assign({}, data, { error: undefined })),
    );

    if (errors.length > 0) {
      throw new UnprocessableEntityException({
        errorCode: errorCodes.KAFKA_VALIDATION_ERROR,
        errors,
      });
    }
  }

  /**
   * Subscribes to predefined topics
   * @param {string} topic
   * @param {boolean} fromBeginning
   */
  private async subscribe(topic: string, fromBeginning = false): Promise<void> {
    await this.consumer.subscribe({ topic, fromBeginning });
  }

  /**
   * Consumes Kafka messages from predefined topics
   */
  private async run() {
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const { callback } = subscriptions.get(topic);
        callback({
          bus: this,
          messageData: this.deserialize(message.value),
        });
      },
    });
  }

  /**
   * Serializes Kafka message
   * @param {KafkaMessageDto<T>} value
   * @returns {string}
   */
  private serialize<T>(value: KafkaMessageDto<T>): string {
    return JSON.stringify(value);
  }

  /**
   * Deserializes Kafka message
   * @param {Buffer} value
   * @returns {KafkaMessageDto<T>}
   */
  private deserialize<T>(value: Buffer): KafkaMessageDto<T> {
    return JSON.parse(value.toString());
  }
}
