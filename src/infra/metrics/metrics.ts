import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

export const metricsRegistry = new Registry();

metricsRegistry.setDefaultLabels({ app: 'portfolio-api' });

// CPU, memória, event loop lag, GC, handles abertos...
collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

export const messagesPublishedTotal = new Counter({
  name: 'messages_published_total',
  help: 'Mensagens publicadas no broker',
  labelNames: ['provider', 'topic', 'result'] as const,
  registers: [metricsRegistry],
});
