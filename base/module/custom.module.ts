import { Provider } from '@nestjs/common';
import { ModuleAsyncOptions, ModuleOptionsFactory } from 'core/base/interface';

/**
 * @class CustomModule
 */
export abstract class CustomModule {
  /**
   * Creates async option provider
   * @param {string} token
   * @param {ModuleAsyncOptions<ModuleOptions, ModuleOptionsFactory<ModuleOptions>>} options
   * @returns {Provider}
   * @protected
   */
  protected static createAsyncOptionsProvider<ModuleOptions>(
    token: string,
    options: ModuleAsyncOptions<
      ModuleOptions,
      ModuleOptionsFactory<ModuleOptions>
    >,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: token,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: token,
      useFactory: async (optionsFactory: ModuleOptionsFactory<ModuleOptions>) =>
        await optionsFactory.createModuleOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}
