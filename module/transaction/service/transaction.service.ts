import { Inject, Injectable } from '@nestjs/common';
import { Connection, EntityManager } from 'typeorm';
import { CommandRepositoryInterface, QueryRepositoryInterface } from 'app/core';
import {
  TransactionModuleOptions,
  TransactionServiceInterface,
  WithTransactionCommandServiceInterface,
  WithTransactionQueryServiceInterface,
} from 'app/module/transaction';
import { DataEntityInterface } from 'core/data/interface';

// TODO [not-critical]: replace `any`

/**
 * Transaction Service
 * @class TransactionService
 */
@Injectable()
export class TransactionService implements TransactionServiceInterface {
  constructor(
    @Inject('TransactionModuleOptionsInterface')
    private readonly options: TransactionModuleOptions,
  ) {}

  runInReadTransaction(
    callback: (
      ...args: WithTransactionQueryServiceInterface<
        DataEntityInterface,
        QueryRepositoryInterface<DataEntityInterface>,
        any
      >[]
    ) => any,
    dependencies: WithTransactionQueryServiceInterface<
      DataEntityInterface,
      QueryRepositoryInterface<DataEntityInterface>,
      any
    >[],
  ): any {
    return this._runInTransaction<
      WithTransactionQueryServiceInterface<
        DataEntityInterface,
        QueryRepositoryInterface<DataEntityInterface>,
        any
      >
    >(callback, dependencies, this.options.readConnection);
  }

  runInWriteTransaction(
    callback: (
      ...args: WithTransactionCommandServiceInterface<
        DataEntityInterface,
        CommandRepositoryInterface<DataEntityInterface>,
        any
      >[]
    ) => any,
    dependencies: WithTransactionCommandServiceInterface<
      DataEntityInterface,
      CommandRepositoryInterface<DataEntityInterface>,
      any
    >[],
  ): any {
    return this._runInTransaction<
      WithTransactionCommandServiceInterface<
        DataEntityInterface,
        CommandRepositoryInterface<DataEntityInterface>,
        any
      >
    >(callback, dependencies, this.options.writeConnection);
  }

  private _runInTransaction<
    ServiceInterface extends
      | WithTransactionCommandServiceInterface<
          DataEntityInterface,
          CommandRepositoryInterface<DataEntityInterface>,
          any
        >
      | WithTransactionQueryServiceInterface<
          DataEntityInterface,
          QueryRepositoryInterface<DataEntityInterface>,
          any
        >
  >(
    callback: (...args: ServiceInterface[]) => any,
    dependencies: ServiceInterface[],
    connection: Connection,
  ): Promise<any> {
    return connection.transaction((manager: EntityManager) => {
      const customDependencies = dependencies.map(
        (dependency: ServiceInterface) => {
          return dependency.withTransaction(manager);
        },
      );

      return callback(...customDependencies);
    });
  }
}
