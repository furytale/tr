import { Connection } from 'typeorm';
import {
  CommandRepositoryInterface,
  CommandServiceInterface,
  DataEntityInterface,
  ModuleAsyncOptions,
  ModuleOptionsFactory,
  QueryRepositoryInterface,
  QueryServiceInterface,
  WithTransactionServiceInterface,
} from 'app/core';

export interface TransactionModuleOptions {
  readConnection: Connection;
  writeConnection: Connection;
}

export type TransactionModuleAsyncOptions = ModuleAsyncOptions<
  // INFO: Type here should be `TransactionModuleOptions`, but it throws error because of
  //  inconsistency between `Connection` in npm-shared-package & microservice-boilerplate.
  any,
  ModuleOptionsFactory<TransactionModuleOptions>
>;

export interface WithTransactionCommandServiceInterface<
  E extends DataEntityInterface,
  R extends CommandRepositoryInterface<E>,
  S
> extends CommandServiceInterface<E, R>,
    WithTransactionServiceInterface<S> {}

export interface WithTransactionQueryServiceInterface<
  E extends DataEntityInterface,
  R extends QueryRepositoryInterface<E>,
  S
> extends QueryServiceInterface<E, R>,
    WithTransactionServiceInterface<S> {}
