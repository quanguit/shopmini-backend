import { Global, Module } from '@nestjs/common';
import { APP_DATA_SOURCE } from './constants/data-source';
import { AppDataSource } from './data-source';

@Global()
@Module({
  //  if have one DB, should be use below
  //  imports: [TypeOrmModule.forRoot(dataSourceOptions)],
  providers: [
    {
      provide: APP_DATA_SOURCE,
      useFactory: async () => {
        if (!AppDataSource.isInitialized) {
          await AppDataSource.initialize();
        }
        return AppDataSource;
      },
    },
  ],
  exports: [APP_DATA_SOURCE],
})
export class DataBaseModule {}
