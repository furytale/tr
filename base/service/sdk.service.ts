import { ClassConstructor } from 'class-transformer';
import { SdkDtoFactory } from 'core/base/factory';
import { plainObject } from 'core/type';

export abstract class SdkService<Factory extends SdkDtoFactory, Transport> {
  protected constructor(
    private readonly _factory: Factory,
    private readonly _transport: Transport,
  ) {}

  protected get transport(): Transport {
    return this._transport;
  }

  protected createDto(
    dto: ClassConstructor<plainObject>,
    input: plainObject,
  ): plainObject {
    return this._factory.createOne(dto, input);
  }
}
