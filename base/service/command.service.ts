import { CommandRepositoryInterface, CommandServiceInterface } from 'core/base';
import { plainObject } from 'core/type';
import { DataEntityInterface } from 'core/data/interface';
import { ErrorServiceInterface } from 'module/error/interface';
import { ValidationServiceInterface } from 'module/validation/interface';
import { errorList, listOfRules } from 'module/validation/util/types';
import { BaseService } from 'core/base/service/base.service';
import { DeepPartial } from 'typeorm';
import { ObjectID } from 'typeorm/driver/mongodb/typings';
import { FindConditions } from 'typeorm/find-options/FindConditions';

/**
 * Command Service
 * @class CommandService
 */
export abstract class CommandService<
    E extends DataEntityInterface,
    R extends CommandRepositoryInterface<E>
  >
  extends BaseService
  implements CommandServiceInterface<E, R> {
  protected constructor(
    errorService: ErrorServiceInterface,
    protected _repository: R,
    protected _validationService: ValidationServiceInterface,
  ) {
    super(errorService);
  }

  /**
   * Repository
   * @returns {R}
   */
  public get repository(): R {
    return this._repository;
  }

  /**
   * Setter for repository
   * @param {R} value
   */
  public set repository(value: R) {
    this._repository = value;
  }

  /**
   * Getter for error service
   * @returns {ErrorServiceInterface}
   */
  public get errorService(): ErrorServiceInterface {
    return this._errorService;
  }

  /**
   * Getter for validation service
   * @returns {ValidationServiceInterface}
   */
  public get validationService(): ValidationServiceInterface {
    return this._validationService;
  }

  public get rules(): listOfRules {
    return {};
  }

  public create(entityLikeArray: DeepPartial<E>[]): E[] {
    return this.repository.create(entityLikeArray);
  }

  public createOne(data?: DeepPartial<E>): E {
    return this.repository.createOne(data);
  }

  public async saveOne(entity: E): Promise<E> {
    let result: E;

    try {
      result = await this.repository.saveOne(entity);
    } catch (e) {
      this.throwError(e);
    }

    return result;
  }

  /**
   * Saves several entities
   * @param {E[]} entities
   * @returns {Promise<E[]>}
   */
  public async save(entities: E[]): Promise<E[]> {
    const result: E[] = [];

    for (const entity of entities) {
      const saved = await this.saveOne(entity);
      result.push(saved);
    }

    return result;
  }

  /**
   * Removes entity
   * @param {E} entity
   * @returns {Promise<E>}
   */
  public async removeOne(entity: E): Promise<E> {
    return this.repository.removeOne(entity);
  }

  /**
   * Deletes one entity by id
   * @param {number | string} id
   * @returns {Promise<boolean>}
   */
  public async deleteOne(id: number | string): Promise<boolean> {
    let result = false;

    try {
      result = await this.repository.deleteOne(id);
    } catch (e) {
      this.throwError(e);
    }

    return result;
  }

  /**
   * Validate one entity
   * @param {E} entity
   * @returns {Promise<errorList | undefined>}
   */
  public async validateOne(entity: E): Promise<errorList | undefined> {
    let result: errorList | undefined = undefined;
    if (this.rules) {
      this.validationService.loadRules(this.rules);
      result = await this.validationService.validate(entity);
    }

    return result;
  }

  /**
   * Validate several entities
   * @param {E[]} entities
   * @returns {Promise<errorList[]>}
   */
  public async validate(entities: E[]): Promise<errorList[]> {
    const result: errorList[] = [];
    if (this.rules) {
      for (const entity of entities) {
        const validation = await this.validateOne(entity);
        result.push(validation);
      }
    }

    return result;
  }

  /**
   * Delete items from db by criteria
   * @param {string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindConditions<E>} options
   * @returns {Promise<number>}
   */
  public async delete(
    options?:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectID
      | ObjectID[]
      | FindConditions<E>,
  ): Promise<number> {
    const result = await this.repository.delete(options);

    return result.affected ?? 0;
  }

  /**
   * Removes entities from db
   * @param {E[]} entities
   * @returns {Promise<E[]>}
   */
  public async remove(entities: E[]): Promise<E[]> {
    const result: E[] = [];

    for (const entity of entities) {
      const removed = await this.removeOne(entity);
      result.push(removed);
    }

    return result;
  }
}
