import { FindManyOptions } from 'typeorm';
import { QueryRepositoryInterface, QueryServiceInterface } from 'core/base';
import { BaseService } from 'core/base/service/base.service';
import { DataEntityInterface } from 'core/data/interface';
import { ErrorServiceInterface } from 'module/error/interface';

/**
 * Query Service
 * @class QueryService
 */
export abstract class QueryService<
    E extends DataEntityInterface,
    R extends QueryRepositoryInterface<E>
  >
  extends BaseService
  implements QueryServiceInterface<E, R> {
  protected constructor(
    errorService: ErrorServiceInterface,
    protected _repository: R,
  ) {
    super(errorService);
  }
  public get repository(): R {
    return this._repository;
  }

  public set repository(value: R) {
    this._repository = value;
  }

  public async findOne(id: number): Promise<E | undefined> {
    let result: E | undefined = undefined;

    try {
      result = await this.repository.findOne(id);
    } catch (e) {
      this.throwError(e);
    }

    return result;
  }

  public async find(options?: FindManyOptions<E>): Promise<E[]> {
    let result: E[] = [];

    try {
      result = await this.repository.find(options);
    } catch (e) {
      this.throwError(e);
    }

    return result;
  }
}
