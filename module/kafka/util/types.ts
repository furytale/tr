import { ConsumerConfig, KafkaConfig } from 'kafkajs';
import { ModuleAsyncOptions, ModuleOptionsFactory } from 'app/core';
import { KafkaMessageDto, KafkaService } from 'module/kafka';

export type kafkaModuleOptions = {
  client: KafkaConfig;
  consumer: ConsumerConfig;
  timeout?: number;
};

export type kafkaModuleAsyncOptions = ModuleAsyncOptions<
  kafkaModuleOptions,
  ModuleOptionsFactory<kafkaModuleOptions>
>;

export type kafkaMessageOptions = {
  isClientRequest?: boolean;
};

export type subscribeOptions = {
  fromBeginning?: boolean;
};

export type subscribeDetails<T> = {
  bus: KafkaService;
  messageData: KafkaMessageDto<T>;
};

export type kafkaHealthCheckOptions = {
  client: KafkaService;
};
