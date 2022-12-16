import { Repository } from 'typeorm';
import { CommandRepositoryInterface } from 'core/base';
import {
  DataEntityInterface,
  EntityFactoryInterface,
} from 'core/data/interface';
import { plainObject } from 'app/core';

/**
 * Command Repository
 * @class CommandRepository
 */
export abstract class CommandRepository<E extends DataEntityInterface>
  extends Repository<E>
  implements CommandRepositoryInterface<E> {
  /**
   * Class constructor
   * @param {EntityFactoryInterface} factory
   * @protected
   */
  protected constructor(protected factory: EntityFactoryInterface<E>) {
    super();
  }

  /**
   * Create one item
   * @param {plainObject} data
   * @returns {E}
   */
  public createOne(data?: plainObject): E {
    return this.factory.createOne(data);
  }

  /**
   * Save one item
   * @param {DeepPartial<E>} entity
   * @returns {Promise<E>}
   */
  public async saveOne(entity: E): Promise<E> {
    return this.save(entity as any);
  }

  /**
   * Delete one item
   * @param {number | string} id
   * @returns {Promise<boolean>}
   */
  public async deleteOne(id: number | string): Promise<boolean> {
    const result = await this.delete(id);
    return result.affected > 0;
  }

  /**
   * Removes one item
   * @param {E} entity
   * @returns {Promise<E>}
   */
  public async removeOne(entity: E): Promise<E> {
    return this.remove(entity);
  }
}
