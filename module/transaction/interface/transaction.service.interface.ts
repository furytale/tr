import {
  CommandRepositoryInterface,
  CommandServiceInterface,
  QueryRepositoryInterface,
  QueryServiceInterface,
} from 'app/core';
import { DataEntityInterface } from 'core/data/interface';

/**
 * Transaction Service Interface
 * @interface TransactionServiceInterface
 */
export interface TransactionServiceInterface {
  runInReadTransaction(
    callback: (
      ...args: QueryServiceInterface<
        DataEntityInterface,
        QueryRepositoryInterface<DataEntityInterface>
      >[]
    ) => any,
    dependencies: QueryServiceInterface<
      DataEntityInterface,
      QueryRepositoryInterface<DataEntityInterface>
    >[],
  ): any;

  runInWriteTransaction(
    callback: (
      ...args: CommandServiceInterface<
        DataEntityInterface,
        CommandRepositoryInterface<DataEntityInterface>
      >[]
    ) => any,
    dependencies: CommandServiceInterface<
      DataEntityInterface,
      CommandRepositoryInterface<DataEntityInterface>
    >[],
  ): any;
}
