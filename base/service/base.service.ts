import { errorCode, errorMessage } from 'core/base/util/enums';
import { errorData } from 'module/error/util/types';
import { ErrorServiceInterface } from 'module/error/interface';

export abstract class BaseService {
  public get errorService(): ErrorServiceInterface {
    return this._errorService;
  }

  protected constructor(protected _errorService: ErrorServiceInterface) {}

  /**
   * Throws structured error
   * @param error
   * @returns {never}
   * @protected
   */
  protected throwError(error: any): never {
    const { message, name, code, detail, constraint, query } = error;
    const errorData: errorData = {
      errorCode: errorCode.DB_ERROR,
      message: errorMessage.DB_ERROR_OCCURRED,
      data: {
        message,
        name,
        code,
        detail,
        constraint,
        query,
      },
    };
    const errorEntity = this.errorService.create(errorData);
    this.errorService.throw(errorEntity);

    throw error;
  }
}
