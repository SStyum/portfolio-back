import type { NextFunction, Request, Response } from 'express';
import { httpRequestDuration, httpRequestsTotal } from './metrics';

// Middleware global do Express (e não interceptor do Nest) pra também medir respostas de guards, como 401
export function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const stopTimer = httpRequestDuration.startTimer();

  res.on('finish', () => {
    // Usa o padrão da rota (/posts/:postId), não a URL real: evita uma série por id
    const route: string = req.route?.path ?? 'unmatched';

    if (route === '/metrics') {
      return;
    }

    const labels = { method: req.method, route, status: String(res.statusCode) };

    httpRequestsTotal.inc(labels);
    stopTimer(labels);
  });

  next();
}
