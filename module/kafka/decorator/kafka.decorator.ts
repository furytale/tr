import { serializeError } from 'serialize-error';
import {
  subscribeDetails,
  subscribeOptions,
  SUBSCRIPTIONS_METADATA,
} from 'app/module/kafka';
import { get } from 'app/util';

export const properties = new Map();
export const subscriptions = new Map();
export const responseDecorators = new Map();

export function UseSubscribe() {
  return function <T extends { new (...args: any[]): any }>(constructor: T) {
    return class extends constructor {
      constructor(...args) {
        super(...args);

        const subscriptionsMetadata = Reflect.getMetadata(
          SUBSCRIPTIONS_METADATA,
          constructor.prototype,
        );

        for (const { topic, callback, ...rest } of subscriptionsMetadata) {
          subscriptions.set(topic, {
            callback: callback.bind(this),
            ...rest,
          });
        }
      }
    };
  };
}

export function Subscribe<T, R>(topic: string, options: subscribeOptions = {}) {
  return (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<R>>,
  ) => {
    const subscriptionsMetadata =
      Reflect.getMetadata(SUBSCRIPTIONS_METADATA, target) || [];

    Reflect.defineMetadata(
      SUBSCRIPTIONS_METADATA,
      [
        ...subscriptionsMetadata,
        {
          topic,
          options,
          callback: async function (subscriptionDetails: subscribeDetails<T>) {
            let data, error;
            const { bus, messageData } = subscriptionDetails;

            try {
              data = await descriptor.value.apply(
                this,
                properties
                  .get(target)
                  ?.[propertyKey]?.map((property: string) =>
                    get(subscriptionDetails, property),
                  ),
              );
            } catch (e) {
              error = e;
              throw e;
            } finally {
              const isWaitingForResponse = responseDecorators.get(target)[
                propertyKey
              ];

              if (isWaitingForResponse) {
                const message = await bus.createMessage<T>({
                  topic: messageData.responseTo,
                  data,
                  error: serializeError(error),
                });
                await bus.sendMessage<T>(message);
              }
            }
          },
        },
      ],
      target,
    );
  };
}

export function Response() {
  return (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<any>>,
  ) => {
    responseDecorators.set(target, {
      ...responseDecorators.get(target),
      [propertyKey]: true,
    });

    return descriptor;
  };
}

export function SubscriptionDetails(property: string): ParameterDecorator {
  return (target: any, propertyKey: string, parameterIndex: number): void => {
    const propertiesTarget = properties.get(target);
    const propertiesTargetPropertyKey = propertiesTarget?.[propertyKey]
      ? propertiesTarget[propertyKey]
      : [];
    propertiesTargetPropertyKey[parameterIndex] = property;
    properties.set(target, {
      ...propertiesTarget,
      [propertyKey]: propertiesTargetPropertyKey,
    });
  };
}

export function MessageData(property: string): ParameterDecorator {
  return SubscriptionDetails(`messageData.${property}`);
}
