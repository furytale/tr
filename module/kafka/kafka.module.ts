import { DynamicModule, Global, Module } from '@nestjs/common';
import { CustomModule, KafkaTransport } from 'app/core';
import {
  KafkaMessageFactory,
  kafkaModuleOptions,
  kafkaModuleAsyncOptions,
  KafkaHealthIndicator,
  KafkaService,
} from 'app/module/kafka';
import { LoggerModule } from 'app/service';

@Global()
@Module({})
export class KafkaModule extends CustomModule {
  static forRoot(options: kafkaModuleOptions): DynamicModule {
    return {
      module: KafkaModule,
      imports: [LoggerModule.forRoot()],
      providers: [
        {
          provide: 'KafkaModuleOptionsInterface',
          useValue: options,
        },
        {
          provide: 'KafkaMessageFactoryInterface',
          useClass: KafkaMessageFactory,
        },
        KafkaHealthIndicator,
        KafkaService,
      ],
      exports: [KafkaHealthIndicator, KafkaService],
    };
  }

  static forRootAsync(asyncOptions: kafkaModuleAsyncOptions): DynamicModule {
    return {
      module: KafkaModule,
      imports: [LoggerModule.forRoot()],
      providers: [
        this.createAsyncOptionsProvider(
          'KafkaModuleOptionsInterface',
          asyncOptions,
        ),
        {
          provide: 'KafkaMessageFactoryInterface',
          useClass: KafkaMessageFactory,
        },
        KafkaHealthIndicator,
        KafkaService,
        KafkaTransport,
      ],
      exports: [KafkaHealthIndicator, KafkaService, KafkaTransport],
    };
  }
}
