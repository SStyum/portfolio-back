# Core
[x] - DDD
[x] - Clean Architecture
[x] - CQRS (opcional)
[x] - SOLID
[] - Domain Events
[] - Repository Pattern
[] - Unit of Work
[] - Result Pattern
[] - Either Pattern
[] - Value Objects
[] - Entities
[] - Aggregates
[x] - Use Cases
[] - DTOs
[] - Mappers
[] - Exception Filters
[] - Validation Pipes
[] - Logger
[] - Config Module
[] - Environment Validation
2. Usuário
[] - CRUD
[] - Perfil
[] - Avatar
[] - Alteração de senha
[] - Alteração de email
[] - Exclusão lógica
[] - Exclusão definitiva
[] - Auditoria
[] - Histórico de login
[] - Preferências
[] - Configurações de IA
[] - Feature Flags por usuário
3. Autenticação
[] - JWT
[] - Refresh Token
[] - Rotação de Refresh Token
[] - Logout global
[] - Logout por dispositivo
[] - OAuth Google
[] - OAuth GitHub
[] - Magic Link
[] - Confirmação de email
[] - Recuperação de senha
[] - MFA/TOTP
[] - Sessões
[] - Lista de dispositivos
4. Permissões
[] - RBAC
[] - Policies
[] - Roles
[] - Permissions
[] - Guard customizado
[] - ACL
[] - Ownership
5. Posts
[] - CRUD
[] - Draft
[] - Publicação
[] - Versionamento
[] - Soft Delete
[] - Tags
[] - Categorias
[] - Likes
[] - Favoritos
[] - Compartilhamento
[] - Histórico de edição
6. Comentários
[] - CRUD
[] - Respostas
[] - Threads
[] - Curtidas
[] - Denúncias
[] - Moderação
7. Pesquisa
[] - Full Text Search
[] - Busca vetorial
[] - Busca híbrida
[] - Autocomplete
[] - Sugestões
[] - Ranking
8. IA
[] - Gateway de IA
[] - Provedor OpenAI
[] - Provedor Groq
[] - Provedor Gemini
[] - Fallback automático
[] - Streaming
[] - Contagem de tokens
[] - Histórico
[] - Context Window
[] - Prompt Builder
[] - Prompt Templates
[] - Ferramentas (Tool Calling)
[] - Function Calling
9. RAG
[] - Knowledge
[] - Chunking
[] - Embedding
[] - Ingestão automática
[] - Reindexação
[] - Busca vetorial
[] - Similaridade
[] - Prompt Context
[] - Versionamento
[] - Atualização incremental
10. Memória da IA
[] - Conversas
[] - Mensagens
[] - Memória curta
[] - Memória longa
[] - Preferências do usuário
[] - Resumo automático de conversas antigas
[] - Busca vetorial da memória
[] - Recuperação contextual
11. Chat
[] - Chats
[] - Mensagens
[] - Streaming
[] - Continuação de conversa
[] - Renomeação automática
[] - Arquivamento
[] - Exclusão
[] - Exportação
12. Upload
[] - Upload local
[] - AWS S3
[] - Cloudflare R2
[] - MinIO
[] - Upload multipart
[] - Presigned URL
[] - Compressão
[] - Thumbnail
13. Banco Vetorial
[] - pgvector
[] - KnowledgeChunk
[] - UserMemoryChunk
[] - Busca KNN
[] - Similaridade cosseno
[] - Reindexação
14. Cache
[] - Redis
[] - Cache Aside
[] - Invalidação
[] - Cache de IA
[] - Cache de embeddings
[] - Cache de consultas
15. Filas
[] - BullMQ
[] - Redis Queue
[] - Retry
[] - Dead Letter Queue
[] - Backoff
[] - Worker dedicado
16. Eventos
[] - Domain Events
[] - Event Bus
[] - Integration Events
[] - Event Handlers
[] - Outbox Pattern
17. Scheduler
[] - Cron
[] - Reindexação
[] - Limpeza de cache
[] - Expiração de sessões
[] - Resumo de memória
[] - Jobs automáticos
18. Notificações
[] - Email
[] - Push
[] - WebSocket
[] - SMS (mock)
[] - Preferências de notificação
19. Pagamentos
[] - Stripe
[] - Mercado Pago
[] - Webhooks
[] - Idempotência
[] - Assinaturas
[] - Upgrade de plano
[] - Cancelamento
[] - Reembolso
20. Observabilidade
[] - Logs estruturados
[] - Correlation ID
[] - Request ID
[] - Health Check
[] - Métricas
[] - Tempo de resposta
[] - Uso de tokens
[] - Consumo por usuário
21. Segurança
[] - Helmet
[] - CORS
[] - Sanitização
[] - SQL Injection
[] - XSS
[] - CSRF
[] - Rate Limit
[] - IP Blocking
[] - Auditoria
22. API
[] - Swagger
[] - Versionamento
[] - Paginação
[] - Filtros
[] - Ordenação
[] - Cursor Pagination
[] - ETag
23. Testes
[] - Unitários
[] - Integração
[] - E2E
[] - Mocks
[] - Testes de IA
[] - Testes de RAG
[] - Cobertura >90%
24. Infraestrutura
[] - Docker
[] - Docker Compose
[] - PostgreSQL
[] - Redis
[] - pgvector
[] - MinIO
[] - Nginx
[] - CI/CD
[] - GitHub Actions
25. Diferenciais que chamam atenção
[] - Sistema de plugins para provedores de IA
[] - Troca dinâmica entre OpenAI, Groq e Gemini
[] - Fallback automático se um provedor falhar
[] - Streaming SSE/WebSocket
[] - Memória de longo prazo baseada em embeddings
[] - RAG sobre base própria
[] - Ferramentas (Tool Calling) para consultar banco, clima ou APIs
[] - Dashboard de uso de IA (tokens, custo, latência)
[] - Cache inteligente de respostas
[] - Resumo automático de conversas antigas para economizar contexto
[] - Multi-tenant (cada organização com sua própria base de conhecimento)
[] - Auditoria completa das chamadas de IA