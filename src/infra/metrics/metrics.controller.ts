import { ApiExcludeController } from '@nestjs/swagger';
import { Controller, Get, Headers, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../auth/public';
import { EnvService } from '../env/env.service';
import { metricsRegistry } from './metrics';

@ApiExcludeController()
@Controller('/metrics')
export class MetricsController {
  constructor(private env: EnvService) { }

  // Endpoint que o Prometheus raspa. Com METRICS_TOKEN definido, exige "Authorization: Bearer <token>"
  @Get()
  @Public()
  async handle(
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ) {
    const token = this.env.get('METRICS_TOKEN');

    if (token && authorization !== `Bearer ${token}`) {
      throw new UnauthorizedException();
    }

    res.set('Content-Type', metricsRegistry.contentType);
    res.send(await metricsRegistry.metrics());
  }
}
