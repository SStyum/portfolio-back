import { Module, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { StorageGateway, StorageProviderName } from '../../core/gateways/storage.gateway';
import { EnvModule } from '../env/env.module';
import { EnvService } from '../env/env.service';
import { S3StorageGateway } from './s3/s3-storage.gateway';

// Uma entrada por storage. O Record força registrar todo provider declarado em StorageProviderName.
const STORAGE_GATEWAYS: Record<StorageProviderName, Type<StorageGateway>> = {
  S3: S3StorageGateway,
};

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: StorageGateway,
      inject: [EnvService, ModuleRef],
      // Só instancia o gateway escolhido em STORAGE_PROVIDER
      useFactory: (env: EnvService, moduleRef: ModuleRef) =>
        moduleRef.create(STORAGE_GATEWAYS[env.get('STORAGE_PROVIDER')]),
    },
  ],
  exports: [StorageGateway],
})
export class StorageModule {}
