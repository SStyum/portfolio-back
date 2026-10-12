import { Module } from '@nestjs/common';
import { EnvModule } from '../env/env.module';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [EnvModule],
  controllers: [MetricsController],
})
export class MetricsModule {}
