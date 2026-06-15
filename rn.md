🏗️ FASE 1 - Arquitetura de Domínio (95% obrigatório)

É o coração do sistema.

✅ NestJS
✅ Clean Architecture
✅ SOLID
✅ DDD
✅ Repository Pattern
✅ Value Objects
✅ Entities
✅ Aggregate Roots
✅ Domain Events
⬜ Outbox Pattern
⬜ Unit of Work (opcional)

Objetivo: ter um domínio completamente desacoplado do framework.

📬 FASE 2 - Arquitetura Assíncrona

Depois que os eventos existem, eles precisam fazer alguma coisa.

⬜ Redis
⬜ BullMQ
⬜ Queues
⬜ Workers
⬜ Retry
⬜ Exponential Backoff
⬜ Dead Letter Queue
⬜ Jobs Agendados (Cron)
⬜ Prioridade de Jobs
⬜ Rate Limiting por fila

Objetivo: tudo que demora sai da requisição HTTP.

📢 FASE 3 - Event Bus Distribuído

Agora os eventos deixam de existir apenas dentro do processo.

⬜ Event Bus interno
⬜ Redis Pub/Sub
⬜ SQS
⬜ Fan-out de eventos
⬜ Subscribers
⬜ Event Versioning
⬜ Idempotência de consumidores

Objetivo: preparar o sistema para crescer em múltiplos serviços.

☁️ FASE 4 - Infraestrutura AWS

Quando o backend estiver maduro, coloque-o na nuvem.

⬜ S3
⬜ Lambda
⬜ SQS
⬜ RDS
⬜ CloudFront
⬜ Secrets Manager
⬜ CloudWatch
⬜ IAM bem configurado

Objetivo: mostrar domínio de cloud.

⚡ FASE 5 - Performance

Todo sistema grande precisa ser rápido.

⬜ Redis Cache
⬜ Cache Aside
⬜ Cache Invalidation
⬜ Query Optimization
⬜ Índices
⬜ Connection Pool
⬜ Compressão
⬜ Streaming
⬜ Paginação por Cursor

Objetivo: reduzir latência e carga no banco.

🔐 FASE 6 - Segurança

Aqui você mostra maturidade.

⬜ JWT
⬜ Refresh Token
⬜ Refresh Rotation
⬜ RBAC
⬜ Permission Based Access
⬜ Helmet
⬜ CSP
⬜ HSTS
⬜ Rate Limit
⬜ Sanitização
⬜ Validação
⬜ Idempotência
⬜ Auditoria
⬜ Soft Delete
⬜ MFA

Objetivo: demonstrar preocupação com produção.

📊 FASE 7 - Observabilidade

Essa é uma das áreas mais subestimadas.

⬜ Logs estruturados
⬜ Correlation ID
⬜ Request ID
⬜ Trace ID
⬜ OpenTelemetry
⬜ Prometheus
⬜ Grafana
⬜ Jaeger
⬜ Health Check
⬜ Readiness Probe
⬜ Liveness Probe

Objetivo: conseguir descobrir qualquer problema rapidamente.

🤖 FASE 8 - Inteligência Artificial

Agora sim faz sentido integrar IA.

⬜ API de LLM
⬜ Function Calling
⬜ RAG
⬜ Embeddings
⬜ pgvector
⬜ Memória de Conversa
⬜ Agentes especializados
⬜ Classificação automática
⬜ Resumo automático
⬜ Extração de dados

Objetivo: mostrar integração com IA de forma arquitetural, não só um chat.

🌐 FASE 9 - APIs
⬜ REST
⬜ Webhooks
⬜ WebSocket
⬜ SSE
⬜ OpenAPI
⬜ Versionamento
⬜ OAuth2
⬜ API Keys

Objetivo: construir integrações robustas.

🧪 FASE 10 - Qualidade
⬜ Testes Unitários
⬜ Testes de Integração
⬜ E2E
⬜ Contract Testing
⬜ Testes de Carga
⬜ Testes de Stress
⬜ Mutation Testing

Objetivo: garantir confiança para evoluir o sistema.

🚀 FASE 11 - DevOps
⬜ Docker
⬜ Docker Compose
⬜ Multi-stage Build
⬜ GitHub Actions
⬜ CI
⬜ CD
⬜ Rollback
⬜ Blue/Green Deploy
⬜ Feature Flags

Objetivo: automatizar todo o ciclo de entrega.

🎨 FASE 12 - O GRANDE DIFERENCIAL DO PORTFÓLIO

Essa é a parte que eu vou mais investir.
Transformar o backend em algo visível.

Imagine um painel onde, ao clicar em "Criar Usuário", o usuário vê em tempo real:

🌎 Cliente
      │
      ▼
 API (NestJS)
      │
      ▼
 Domain Event
      │
      ▼
 Outbox
      │
      ▼
 BullMQ
      │
      ▼
 Redis
      │
      ▼
 Worker
      │
      ├────────► Email
      │
      ├────────► IA
      │
      ├────────► Analytics
      │
      └────────► Webhook

Cada bloco poderia acender, mudar de cor e mostrar o tempo gasto, os logs e até possíveis falhas.
