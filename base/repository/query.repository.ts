import { Repository } from 'typeorm';
import { QueryRepositoryInterface } from 'core/base';
import { DataEntityInterface } from 'core/data/interface';

/**
 * Query Repository
 * @class QueryRepository
 */
export abstract class QueryRepository<E extends DataEntityInterface>
  extends Repository<E>
  implements QueryRepositoryInterface<E> {}
