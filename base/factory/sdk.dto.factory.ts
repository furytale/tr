import { ClassConstructor, plainToClass } from 'class-transformer';
import { FactoryInterface } from 'core/base';
import { plainObject } from 'core/type';

/**
 * Creates dto for sdk
 * @Class SdkFactory
 */
export class SdkDtoFactory implements FactoryInterface {
  public create(
    dtoClass: ClassConstructor<plainObject>,
    dtoData: plainObject[],
  ): plainObject[] {
    return plainToClass(dtoClass, dtoData);
  }

  public createOne(
    dtoClass: ClassConstructor<plainObject>,
    dtoData?: plainObject,
  ): plainObject {
    return plainToClass(dtoClass, dtoData);
  }
}
