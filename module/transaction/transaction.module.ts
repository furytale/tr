import { DynamicModule, Global, Module } from '@nestjs/common';
import { CustomModule } from 'app/core';
import {
  TransactionModuleAsyncOptions,
  TransactionModuleOptions,
  TransactionService,
} from 'app/module/transaction';

/**
 * Transaction Module
 * @class TransactionModule
 */
@Global()
@Module({})
export class TransactionModule extends CustomModule {
  static forRoot(options: TransactionModuleOptions): DynamicModule {
    return {
      module: TransactionModule,
      providers: [
        {
          provide: 'TransactionModuleOptionsInterface',
          useValue: options,
        },
        {
          provide: 'TransactionServiceInterface',
          useClass: TransactionService,
        },
      ],
      exports: ['TransactionServiceInterface'],
    };
  }

  static forRootAsync(
    asyncOptions: TransactionModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: TransactionModule,
      providers: [
        this.createAsyncOptionsProvider<TransactionModuleOptions>(
          'TransactionModuleOptionsInterface',
          asyncOptions,
        ),
        {
          provide: 'TransactionServiceInterface',
          useClass: TransactionService,
        },
      ],
      exports: ['TransactionServiceInterface'],
    };
  }
}
