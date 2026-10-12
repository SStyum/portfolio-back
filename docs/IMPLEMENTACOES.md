# Registro de implementações

Documento vivo com tudo que foi implementado no backend. Cada entrada nova entra no **Registro**, e os detalhes ficam na seção da funcionalidade, sempre em duas partes: **Como usar** e **Como foi feito**.

## Registro

| Data | Commit | O que foi feito |
|---|---|---|
| 2026-10-12 | `ec43d42` | Pagamentos desacoplados da Stripe (porta `PaymentGateway` + escolha da API por env) |
| 2026-10-12 | `382807b` | `PaymentsRepository` + `PrismaPaymentsRepository`, `clientPayload` tipado, endpoint `POST /payments` |
| 2026-10-12 | `bf3d967` | Integração AWS: SQS, S3, Secrets Manager, Lambda + API Gateway, deploy em CDK, LocalStack |
| 2026-10-12 | `bf3d967` | RDS PostgreSQL no stack (configuração mais barata, sem NAT Gateway) |
| 2026-10-12 | — | RabbitMQ como segundo broker (exchange topic, quorum queue, DLX, confirm channel, reconexão) |
| 2026-10-12 | — | Blog: posts e comentários (CRUD com autorização por autor, paginação, evento `comment.created`) |
| 2026-10-12 | — | Observabilidade: métricas Prometheus (`/metrics`) + Grafana com dashboard provisionado |
| 2026-10-12 | — | Segurança: `/me` sem hash de senha, dono do chat checado, `plan` × `role` separados, guard de admin, chat com IA consertado |
| 2026-10-12 | — | Assinatura recorrente (Stripe Checkout + Portal + webhook idempotente) e limites por plano (cota de IA + rate limit) |
| 2026-10-12 | — | Verificação de e-mail (SES/LOG) e login com GitHub (OAuth 2.0) |
| 2026-10-12 | — | Swagger em `/docs` (bodies gerados dos schemas Zod) |
| 2026-10-12 | — | 61 testes unitários (in-memory + fakes) e CI no GitHub Actions |
| 2026-10-12 | — | 39 testes E2E (app real + Postgres real isolado por arquivo) e job de E2E no CI |

## Sumário

1. [Pagamentos](#1-pagamentos)
2. [Mensageria (SQS e RabbitMQ)](#2-mensageria-sqs-e-rabbitmq)
3. [Storage (S3)](#3-storage-s3)
4. [Secrets Manager](#4-secrets-manager)
5. [Lambda + API Gateway](#5-lambda--api-gateway)
6. [Deploy na AWS (CDK)](#6-deploy-na-aws-cdk)
7. [RDS PostgreSQL](#7-rds-postgresql)
8. [Ambiente local (Docker Compose)](#8-ambiente-local-docker-compose)
9. [Blog (posts e comentários)](#9-blog-posts-e-comentários)
10. [Observabilidade (Prometheus + Grafana)](#10-observabilidade-prometheus--grafana)
11. [Contas, segurança e verificação de e-mail](#11-contas-segurança-e-verificação-de-e-mail)
12. [Login com GitHub](#12-login-com-github)
13. [Assinatura e limites por plano](#13-assinatura-e-limites-por-plano)
14. [Documentação da API (Swagger)](#14-documentação-da-api-swagger)
15. [Testes e CI](#15-testes-e-ci)
16. [Variáveis de ambiente](#16-variáveis-de-ambiente)
17. [Pendências conhecidas](#17-pendências-conhecidas)

---

## 1. Pagamentos

### Como usar

**Criar um pagamento** (precisa de JWT):

```http
POST /payments
Authorization: Bearer <token>
Content-Type: application/json

{ "amount": 1990, "currency": "BRL", "metadata": { "plan": "pro" } }
```

- `amount` é em centavos.
- `currency` aceita 3 letras e é convertida para minúsculas.

Resposta `201`:

```json
{
  "payment": { "id": "...", "provider": "STRIPE", "amount": 1990, "currency": "brl", "status": "PENDING", "createdAt": "..." },
  "clientPayload": { "type": "client_secret", "clientSecret": "pi_..._secret_..." }
}
```

Se a API de pagamento falhar, a resposta é `502`.

**No frontend**, use o `type` do `clientPayload` para decidir o que fazer, sem precisar saber qual API está por trás:

```ts
switch (clientPayload.type) {
  case "client_secret": // Stripe Elements: stripe.confirmPayment({ clientSecret })
  case "redirect":      // window.location.href = clientPayload.url
  case "pix":           // exibir clientPayload.qrCode / qrCodeBase64
}
```

**Trocar de API de pagamento:** mude `PAYMENT_PROVIDER` no `.env`.

**Adicionar uma API nova** (ex.: MercadoPago):

1. Adicione `"MERCADOPAGO"` em `PAYMENT_PROVIDERS`, em `src/domain/payment/enterprise/entities/payment.ts`.
2. Adicione `MERCADOPAGO` no enum `PaymentProvider` do `prisma/schema.prisma` e rode `npx prisma migrate dev`.
3. Crie `src/infra/providers/mercadopago/mercadopago-payment.gateway.ts` implementando `PaymentGateway`.
4. Registre a classe em `PAYMENT_GATEWAYS`, no `src/infra/providers/payment.module.ts`. O TypeScript dá erro se você esquecer este passo.
5. Adicione as credenciais da API no `env.ts`, exigidas só quando ela estiver ativa (veja o `superRefine`).

O domínio e o use case não mudam.

### Como foi feito

**Problema:** o código estava preso à Stripe em vários pontos:
- o use case fixava `provider: "STRIPE"` e usava um `StripeStatusMapper` que ficava em `core/`;
- a entidade e o banco tinham colunas `stripePaymentIntentId` e `stripeCustomerId`;
- a porta importava tipos do `@prisma/client`;
- o retorno da porta tinha `clientSecret`, que é um conceito da Stripe.

**Solução**, no mesmo padrão do `AiService`:

| Camada | Arquivo | Papel |
|---|---|---|
| Domínio | `src/domain/payment/application/gateway/payment.gateway.ts` | Porta `PaymentGateway` (abstract class) + tipos `CreatePaymentInput/Output` e `PaymentClientPayload` |
| Domínio | `src/domain/payment/enterprise/entities/payment.ts` | Entidade com `externalId` / `externalCustomerId` e a lista `PAYMENT_PROVIDERS` |
| Domínio | `src/domain/payment/application/use-cases/create-payment-use-case.ts` | Usa `paymentGateway.name` e não conhece nenhuma API. Erros da API viram `left(PaymentGatewayError)` |
| Domínio | `src/domain/payment/application/repository/payments-repository.ts` | `create`, `save`, `findById`, `findManyByUserId`, `findByExternalId(provider, externalId)` |
| Infra | `src/infra/providers/stripe/stripe-payment.gateway.ts` | Adapter da Stripe. O mapeamento de status da Stripe fica só aqui |
| Infra | `src/infra/providers/payment.module.ts` | Registro `PAYMENT_GATEWAYS` + factory que instancia só o gateway escolhido em `PAYMENT_PROVIDER` |
| Infra | `src/infra/database/prisma/repositories/payment-prisma-repository.ts` | Implementação Prisma do repositório |
| Infra | `src/infra/http/controllers/create-payment.controller.ts` | `POST /payments` com validação Zod |
| Infra | `src/infra/http/presenters/payment-presenter.ts` | Formato HTTP do pagamento |

**Decisões:**
- **O `PaymentGateway` já devolve o status do domínio.** Cada adapter faz o seu mapeamento, então não existe mapper genérico.
- **O `clientPayload` é uma união discriminada pelo `type`.** Cobre SDK no front (`client_secret`), checkout hospedado (`redirect`) e PIX (`pix`).
- **O banco ganhou um índice único `(provider, externalId)`.** O mesmo ID externo pode se repetir entre APIs diferentes. A migration `20261012000000_payment_provider_agnostic` usa `RENAME COLUMN` para não perder dados.
- **Bug corrigido no `eventId`:** ele era gravado como `''`, mas a coluna é `@unique`, então o segundo pagamento quebraria. Agora fica `null` até o webhook preencher.
- **O `customerId` não vem do body.** Se viesse, um usuário poderia usar o customer de outra pessoa.

---

## 2. Mensageria (SQS e RabbitMQ)

### Como usar

**Escolher o broker:** `MESSAGING_PROVIDER=RABBITMQ` (local, padrão do `.env.example`) ou `MESSAGING_PROVIDER=SQS` (AWS, usado pelo CDK).

Injete a porta em qualquer use case ou serviço:

```ts
constructor(private publisher: MessagePublisher) {}

await this.publisher.publish({
  topic: 'payment.created',          // nome lógico do evento
  payload: { paymentId: '123' },
  key: userId,                       // opcional: ordenação/particionamento
  headers: { version: '1' },         // opcional
})
```

| Campo | RabbitMQ | SQS | Kafka (futuro) |
|---|---|---|---|
| `topic` | routing key no exchange `portfolio.events` | atributo `topic` da mensagem | tópico |
| `key` | ignorada | `MessageGroupId` (só em fila FIFO) | message key |
| `headers` | headers AMQP | message attributes | headers |

**RabbitMQ local:**
- Painel: http://localhost:15672 (`docker` / `docker`).
- Topologia já criada no boot:

```
portfolio.events (topic) ──comment.*──▶ notifications (quorum, até 5 entregas)
                                             │ rejeitada 5x
                                             ▼
portfolio.events.dlx (topic) ────#────▶ notifications.dlq
```

- **Para uma fila nova receber eventos,** adicione a fila e o binding em `rabbitmq/definitions.json` (ex.: `payment.*`).

**Adicionar Kafka:**

1. Adicione `"KAFKA"` em `MESSAGING_PROVIDERS`, em `src/core/gateways/message-publisher.ts`.
2. Crie `src/infra/messaging/kafka/kafka-message-publisher.ts` implementando `MessagePublisher`.
3. Registre a classe em `MESSAGE_PUBLISHERS`, no `src/infra/messaging/messaging.module.ts`.
4. Adicione as variáveis do broker no `env.ts`, exigidas só quando ele estiver ativo.

### Como foi feito

- **Porta:** `src/core/gateways/message-publisher.ts`. Fica no `core` porque é transversal.
- **Módulo:** `src/infra/messaging/messaging.module.ts`. A factory instancia só o broker escolhido e o envolve no `MeteredMessagePublisher`.
- **`MeteredMessagePublisher`** (padrão Decorator): conta publicações com sucesso e com erro (`messages_published_total`) para qualquer broker, sem mexer nos adapters.

**SQS** (`src/infra/messaging/sqs/sqs-message-publisher.ts`): usa `@aws-sdk/client-sqs`, uma fila por ambiente e o `topic` como atributo da mensagem.

**RabbitMQ** (`src/infra/messaging/rabbitmq/rabbitmq-message-publisher.ts`), com `amqplib` 2.x:
- **Exchange `topic`:** quem decide o que cada fila recebe é o binding, e não quem publica.
- **Confirm channel + `waitForConfirms()`:** o `publish` só resolve depois que o broker confirma o recebimento.
- **Mensagens `persistent`** em **quorum queues**: sobrevivem a restart do broker (testado).
- **Reconexão automática** com backoff exponencial e jitter (`connect(url, { recovery })`). Testado: com o broker fora do ar, a API continua respondendo, e a mensagem é entregue quando ele volta.
- **Conexão preguiçosa:** criada no primeiro `publish`, então a API sobe mesmo sem o broker.
- **Topologia como código** (`rabbitmq/definitions.json` + `rabbitmq/rabbitmq.conf`): exchanges, filas, bindings, DLX e usuário. A senha fica em hash SHA-256 no arquivo.
- **`x-delivery-limit: 5`:** uma mensagem que falhar 5 vezes vai para a `notifications.dlq`. É o equivalente à DLQ da SQS.

---

## 3. Storage (S3)

### Como usar

```ts
constructor(private storage: StorageGateway) {}

// Upload pelo backend
await this.storage.upload({ key: `users/${id}/avatar.png`, body: buffer, contentType: 'image/png' })

// Upload direto do front (sem passar pela API/Lambda)
const url = await this.storage.getUploadUrl({ key, contentType: 'image/png', expiresInSeconds: 300 })
// front: fetch(url, { method: 'PUT', body: file, headers: { 'content-type': 'image/png' } })

// Download temporário (bucket é privado)
const downloadUrl = await this.storage.getDownloadUrl(key)

await this.storage.delete(key)
```

As URLs pré-assinadas expiram em 5 minutos por padrão.

### Como foi feito

- **Porta:** `src/core/gateways/storage.gateway.ts`, com `STORAGE_PROVIDERS`.
- **Adapter:** `src/infra/storage/s3/s3-storage.gateway.ts`, com `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner`. Usa `forcePathStyle` quando há `AWS_ENDPOINT_URL`, porque o LocalStack precisa disso.
- **Módulo:** `src/infra/storage/storage.module.ts`, importado no `HttpModule`.
- **Config comum dos clients AWS:** `src/infra/aws/aws-client-config.ts` (região + endpoint do LocalStack).

---

## 4. Secrets Manager

### Como usar

- **Local:** não defina `AWS_SECRET_ID` nem `DB_SECRET_ID`. O `.env` continua valendo.
- **Na AWS:** crie o secret da aplicação (uma vez só):

```bash
aws secretsmanager create-secret --name portfolio/app --secret-string '{
  "JWT_PRIVATE_KEY":"...","JWT_PUBLIC_KEY":"...","GROQ_API_KEY":"...",
  "STRIPE_SECRET_KEY":"...","STRIPE_WEBHOOK_SECRET":"...","STRIPE_PRICE_ID_PAID":"...",
  "GITHUB_CLIENT_ID":"...","GITHUB_CLIENT_SECRET":"...",
  "GITHUB_CALLBACK_URL":"https://<ApiUrl>/auth/github/callback"
}'
```

O secret do banco é criado automaticamente pelo RDS (veja a seção 7).

### Como foi feito

- **`src/infra/aws/load-secrets.ts`:**
  - `AWS_SECRET_ID`: lê um secret JSON e copia cada chave para o `process.env`.
  - `DB_SECRET_ID`: lê o secret do RDS (`username`, `password`, `host`, `port`, `dbname`) e monta o `DATABASE_URL` com usuário e senha codificados (`encodeURIComponent`) e `sslmode=verify-full`.
  - Variáveis já definidas no ambiente têm prioridade (`??=`).
- **`src/infra/app.factory.ts`** chama o `loadSecrets()` **antes** de importar o `AppModule`, com `await import('./app.module')`. Isso é necessário porque o `ConfigModule.forRoot` valida o env no momento do import.
- **O secret da aplicação fica fora do CDK** (`Secret.fromSecretNameV2`), para as chaves nunca aparecerem no template do CloudFormation.

---

## 5. Lambda + API Gateway

### Como usar

- **Servidor local:** continua igual (`npm run start:dev`).
- **Lambda:** o handler é `dist/src/infra/lambda.handler`, empacotado pelo `Dockerfile.lambda`. Quem builda a imagem é o próprio `cdk deploy`.

**Testar a imagem localmente** (emulador da Lambda já incluso na imagem base):

```bash
docker build -f Dockerfile.lambda -t portfolio-lambda .
docker run -p 9000:8080 --env-file .env portfolio-lambda
curl -XPOST localhost:9000/2015-03-31/functions/function/invocations -d '{
  "version":"2.0","routeKey":"$default","rawPath":"/me","rawQueryString":"","headers":{},
  "requestContext":{"http":{"method":"GET","path":"/me","protocol":"HTTP/1.1","sourceIp":"127.0.0.1","userAgent":"curl"},
  "requestId":"t","routeKey":"$default","stage":"$default","timeEpoch":0},"isBase64Encoded":false}'
```

### Como foi feito

- **`src/infra/app.factory.ts`:** função `createApp()`, que faz o boot compartilhado (secrets, Nest, CORS).
- **`src/infra/main.ts`:** `createApp()` + `listen` (servidor local).
- **`src/infra/lambda.ts`:** `createApp()` + `app.init()` + `@codegenie/serverless-express`. O servidor fica guardado entre invocações enquanto o container está quente, então o cold start só acontece uma vez.
- **`Dockerfile.lambda`:** multi-stage sobre `public.ecr.aws/lambda/nodejs:24`. Roda `prisma generate`, `nest build` e `npm prune --omit=dev`.
- **Por que imagem Docker e não zip:** o Prisma e o `bcrypt` (nativo) dão muito trabalho para empacotar com esbuild.
- **Validado localmente:** `GET /me` sem token respondeu 401, e `POST /signup` respondeu 201 e gravou no Postgres, com o `DATABASE_URL` vindo só do Secrets Manager (LocalStack).

---

## 6. Deploy na AWS (CDK)

### Como usar

Pré-requisitos: AWS CLI autenticado, Docker e o secret `portfolio/app` criado (seção 4).

```bash
cd deploy
npm install
npx cdk bootstrap     # uma vez por conta/região
npx cdk diff          # ver o que vai mudar
npx cdk deploy
./scripts/migrate.sh  # aplica as migrations do Prisma no RDS
```

Rode o `migrate.sh` sempre que houver migration nova.

O deploy gera estas saídas: `ApiUrl`, `DatabaseEndpoint`, `DatabaseSecretArn`, `BucketName`, `EventsQueueUrl`, `EventsDLQUrl`.

Configuração em `deploy/cdk.json` (ou na linha de comando com `-c chave=valor`):

| Contexto | Descrição |
|---|---|
| `secretName` | Nome do secret da aplicação (padrão `portfolio/app`) |
| `frontendUrl` | URL do front: retorno do checkout, links dos e-mails, redirect do GitHub |
| `emailFrom` | Remetente. O domínio precisa estar **verificado no SES** e a conta fora do sandbox, para enviar a qualquer destinatário |

Depois do deploy, cadastre o webhook na Stripe apontando para `https://<ApiUrl>/webhooks/billing`.

### Como foi feito

Pacote separado em `deploy/`, para as dependências do CDK não irem para a imagem da API. O stack fica em `deploy/lib/portfolio-stack.ts`:

| Recurso | Configuração |
|---|---|
| API Gateway | HTTP API → Lambda, CORS liberado (`*`) |
| Lambda | Imagem Docker, ARM64, 1024 MB, timeout 29 s (o API Gateway corta em 30 s) |
| CloudWatch | Log group com retenção de 30 dias |
| S3 | Privado, criptografado, só HTTPS, `RETAIN` no destroy, CORS para PUT/GET |
| SQS | Fila `EventsQueue` + DLQ (5 tentativas, retenção de 14 dias), criptografada |
| Secrets Manager | `portfolio/app` (manual) + secret do RDS (gerado) |
| IAM | A Lambda só pode ler os 2 secrets, ler e escrever no bucket, enviar para a fila e enviar e-mail pelo SES |
| SES | `EMAIL_PROVIDER=SES` na Lambda |
| RDS | Veja a seção 7 |

---

## 7. RDS PostgreSQL

### Como usar

- O banco é criado pelo `cdk deploy`.
- As credenciais ficam no secret `DatabaseSecretArn`. A Lambda lê esse secret sozinha.
- Para rodar migrations, use `deploy/scripts/migrate.sh`.
- Para conectar de fora (DBeaver, psql), pegue as credenciais no secret e use SSL (`sslmode=require`).

### Como foi feito

O objetivo era **o menor custo possível**.

- **Instância:** PostgreSQL 17 (a mesma versão do `docker-compose`, com a extensão `vector`), `db.t4g.micro`, single-AZ, 20 GB gp3, criptografado.
- **Sem custos extras:** Performance Insights e Enhanced Monitoring desligados. O backup de 7 dias não é cobrado enquanto couber no tamanho do disco.
- **No `cdk destroy`,** o RDS tira um snapshot final (`RemovalPolicy.SNAPSHOT`).
- **VPC** só com subnets públicas e **sem NAT Gateway**.

**O trade-off:** o NAT Gateway custa cerca de US$ 32 por mês. Ele seria necessário porque uma Lambda dentro da VPC perde acesso à internet, e a API precisa falar com a Stripe e o Groq. Por isso:

- **A Lambda roda fora da VPC.**
- **O RDS fica com IP público** e a porta 5432 aberta (a Lambda não tem IP fixo). Ele é protegido por SSL obrigatório e por uma senha gerada que vive só no Secrets Manager.
- **O `cdk synth` mostra dois avisos** (W2508 e W9011) por causa disso. Eles são esperados.
- **SSL `verify-full`:** a Lambda usa `NODE_EXTRA_CA_CERTS=/var/runtime/ca-cert.pem`, o bundle da imagem base, que inclui as CAs da RDS. Conferi: são 118 certificados da RDS.

Se no futuro quiser o banco privado, o caminho barato é uma NAT instance (t4g.nano, cerca de US$ 3 a 7 por mês a mais) em vez do NAT Gateway.

**Custo estimado (us-east-1, tráfego baixo):**

| Item | ~US$/mês |
|---|---|
| RDS db.t4g.micro | 11,70 |
| 20 GB gp3 | 2,30 |
| IPv4 público do RDS | 3,65 |
| 2 secrets | 0,80 |
| Lambda, API Gateway, SQS, S3, ECR | ~0 a 1 |
| **Total** | **~19** |

Contas com o free tier antigo (criadas antes de julho de 2025) não pagam o RDS no primeiro ano.

---

## 8. Ambiente local (Docker Compose)

### Como usar

```bash
cp .env.example .env              # e preencha as chaves
docker compose up -d              # Postgres, LocalStack, RabbitMQ, Prometheus, Grafana
npx prisma migrate deploy
npm run start:dev
```

| Serviço | Endereço | Login |
|---|---|---|
| API | http://localhost:3333 | — |
| Postgres (pgvector) | localhost:5450 | `docker` / `docker` |
| LocalStack (S3, SQS, Secrets Manager) | http://localhost:4566 | — |
| RabbitMQ (painel) | http://localhost:15672 | `docker` / `docker` |
| Prometheus | http://localhost:9090 | — |
| Grafana | http://localhost:3000 | `admin` / `admin` |

Comandos úteis:

```bash
docker exec portfolio-localstack awslocal s3 ls s3://portfolio-local/
docker exec portfolio-localstack awslocal sqs receive-message \
  --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/portfolio-events \
  --message-attribute-names All
docker exec portfolio-rabbitmq rabbitmqctl list_queues name messages
```

### Como foi feito

- **`localstack`:** `localstack/localstack:4.12`. A versão está fixada porque, até onde sei, as versões novas (`2026.x`) exigem token de conta. Não confirmei isso.
- **`localstack/init-aws.sh`:** cria o bucket `portfolio-local`, a fila `portfolio-events` e a DLQ.
- **`AWS_ENDPOINT_URL`:** quando definida, todos os clients do SDK apontam para o LocalStack.
- **`rabbitmq`:** `rabbitmq:4.1-management`, com a topologia carregada de `rabbitmq/definitions.json` (seção 2).
- **`prometheus` e `grafana`:** veja a seção 10.

---

## 9. Blog (posts e comentários)

### Como usar

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/posts` | JWT | Cria um post `{ title, content }` |
| `GET` | `/posts?page=1` | público | Lista os posts mais recentes (20 por página, com `excerpt`) |
| `GET` | `/posts/:postId` | público | Post completo |
| `DELETE` | `/posts/:postId` | JWT (autor) | Apaga o post e os comentários dele |
| `POST` | `/posts/:postId/comments` | JWT | Comenta `{ content }` |
| `GET` | `/posts/:postId/comments?page=1` | público | Lista os comentários (20 por página) |
| `DELETE` | `/comments/:commentId` | JWT (autor) | Apaga o comentário |

Respostas de erro:
- `400`: body inválido, `page` < 1 ou id que não é UUID.
- `401`: sem token.
- `403`: tentou apagar algo de outra pessoa.
- `404`: post ou comentário não existe.

**Evento:** todo comentário novo publica `comment.created` no broker, com `commentId`, `postId`, `commentAuthorId`, `postAuthorId` (quem deve ser notificado) e `occurredAt`. No RabbitMQ, ele cai na fila `notifications`.

### Como foi feito

**Domínio** (`src/domain/blog/`):
- **`Post` e `Comment`** são `AggregateRoot`, com o método `isAuthor(userId)` para a regra de autorização.
- **O `Comment.create()`** registra um `CommentCreatedEvent` quando o comentário é novo (sem id). Comentários carregados do banco não disparam evento.
- **Use cases:**
  - `CreatePost`, `GetPost`, `FetchRecentPosts`, `DeletePost`;
  - `CommentOnPost` (falha com `ResourceNotFoundError` se o post não existir), `FetchPostComments`, `DeleteComment`.
- **Os deletes** retornam `NotAllowedError` se o usuário não for o autor.
- **`OnCommentCreated`** (`application/subscribers/`) escuta o evento, busca o autor do post e publica `comment.created` via `MessagePublisher`. Se a publicação falhar, a falha só é logada: o comentário já foi salvo, e o usuário não recebe erro.

**Infra:**
- **Repositórios:** `PrismaPostsRepository` e `PrismaCommentsRepository`. O `create` do comentário chama `DomainEvents.dispatchEventsForAggregate` só **depois** de salvar.
- **Paginação:** `PaginationParams` + `PAGE_SIZE`, em `src/core/repositories/pagination-params.ts`. O pipe `pageQueryValidationPipe` valida o `?page=`.
- **`EventsModule`** (`src/infra/events/`) registra os subscribers.
- **Presenters:** `PostPresenter` (completo e resumo) e `CommentPresenter`.

**Banco** (migration `20261012114827_posts_and_comments`):
- `posts.contet` (com erro de digitação) foi **renomeada** para `content`. Editei a migration à mão, porque o Prisma faria DROP + ADD e perderia os dados.
- Removida a coluna `posts.postId`, que não era usada.
- `posts.userId` agora é obrigatório.
- Nova tabela `comments` com `onDelete: Cascade` no post.
- Índices em `posts(created_at)` e `comments(postId, created_at)`, para as listagens paginadas.

**Testado:** fluxo completo com dois usuários (criar, listar, comentar, 401/403/404/400, deletes, cascade) e a mensagem conferida na fila do RabbitMQ.

---

## 10. Observabilidade (Prometheus + Grafana)

### Como usar

1. `docker compose up -d prometheus grafana` (e a API rodando com `npm run start:dev`).
2. Abra **http://localhost:3000** (`admin` / `admin`), pasta **Portfolio**, dashboard **Portfolio API**.

Painéis:
- **Indicadores rápidos:** requisições/s, latência p95, % de erros 5xx, mensagens prontas na fila `notifications`.
- **Requisições/s e latência p95 por rota.**
- **Respostas por status code.**
- **Mensagens publicadas** por broker, tópico e resultado.
- **Filas do RabbitMQ:** mensagens prontas e sem ack.
- **Node.js:** memória (RSS e heap) e event loop lag p99.

Endpoint bruto: `GET http://localhost:3333/metrics`. Se `METRICS_TOKEN` estiver definido, ele exige `Authorization: Bearer <token>`.

### Como foi feito

- **`src/infra/metrics/metrics.ts`:** registry do `prom-client` com as métricas padrão do Node + `http_requests_total`, `http_request_duration_seconds` (histograma) e `messages_published_total`.
- **`http-metrics.middleware.ts`:** middleware **do Express** (registrado no `app.factory.ts`) em vez de interceptor do Nest. Assim ele também mede respostas de guards, como os 401.
  - O label `route` usa o padrão da rota (`/posts/:postId`), não a URL real, para não criar uma série por id.
- **`metrics.controller.ts`:** `GET /metrics`, público, com proteção opcional por token.
- **`monitoring/prometheus/prometheus.yml`:** raspa a API (`host.docker.internal:3333`) e o plugin `rabbitmq_prometheus` (`/metrics/per-object`, métricas por fila).
- **`monitoring/grafana/`:** datasource e dashboard **provisionados como código**. O Grafana já sobe configurado.
- **Testado:** os dois alvos aparecem como `up` no Prometheus, e todas as queries do dashboard retornam dados.

**Na AWS:** a Lambda não tem um processo fixo para o Prometheus raspar. Lá, o caminho é o CloudWatch (logs e métricas da Lambda e do API Gateway), que o Grafana também consegue ler como datasource.

---

## 11. Contas, segurança e verificação de e-mail

### Como usar

1. `POST /signup` `{ name, email, password }`. A senha precisa ter **pelo menos 8 caracteres**. A conta nasce **não verificada** e um e-mail com o link é enviado.
2. O link aponta para `FRONTEND_URL/verify-email?token=...`. O front chama `POST /auth/verify-email` `{ token }` → `204`.
3. `POST /sessions` `{ email, password }` → `{ access_token }`. Antes da verificação, a resposta é `403`.
4. Não recebeu o e-mail? `POST /auth/resend-verification` `{ email }` → sempre `202`.
5. `GET /me` → `{ id, name, email, plan, role }`.

**Local:** com `EMAIL_PROVIDER=LOG`, o e-mail inteiro (com o link) aparece no terminal da API.

**Rotas só para admin:** use o decorator `@AdminitratorAccess()`. Quem não tem `role=ADMIN` recebe `403`. Para promover alguém: `update users set role='ADMIN' where email='...'`.

### Como foi feito

**Correções de segurança:**
- **`UserPresenter` não devolve mais o `password`.** Antes, o `GET /me` expunha o hash da senha.
- **`SendMessageUseCase` confere se o chat é do usuário logado** (`NotAllowedError` → `403`). O body agora é validado com Zod.
- **`plan` e `role` separados.** A coluna `role` guardava o plano (FREE/PAID), enquanto o JWT esperava uma permissão (FREE/ADM). A migration `split_user_plan_and_role` renomeia a coluna para `plan` sem perder dados e cria `role` (USER/ADMIN).
  - O JWT carrega só `sub` e `role`.
  - O **plano é lido do banco** quando precisa, porque muda com o pagamento e um token antigo ficaria desatualizado.
- **`JwtAuthGuard` aplica `@AdminitratorAccess()`.** Antes, o decorator existia mas ninguém o verificava.
- **Chat com IA consertado:** `ChatRepository.findById` e `MessageRepository.findByChatId` lançavam "Method not implemented", e o client do Groq não tinha `baseURL` (mandava a chave do Groq para a OpenAI). O histórico enviado à IA agora é limitado às últimas 20 mensagens.
- **Signup:** valida e-mail, exige senha com 8+ caracteres e responde `409` (antes `401`) para e-mail duplicado. Removido o campo `payment`, que não era salvo.

**Verificação de e-mail:**
- `User` virou `AggregateRoot` e dispara `UserCreatedEvent`. O subscriber `OnUserCreated` chama `SendEmailVerificationUseCase`, que gera o token e avisa via porta `UserNotifier`.
- **Portas no domínio:**
  - `EmailVerificationToken`: implementado como JWT de 24 h. Ele **não tem `sub`**, então a `JwtStrategy` recusa se alguém tentar usá-lo como access token (testado).
  - `UserNotifier`: o domínio diz *o que* avisar, e a infra (`EmailUserNotifier`) monta o link e o HTML.
- **Envio:** porta `EmailSender` (`src/core/gateways/email-sender.ts`) com adapters `LOG` e `SES` (`@aws-sdk/client-sesv2`), no mesmo esquema de registro + env (`EMAIL_PROVIDER`).
- **Login bloqueado sem verificação (`403`).** A checagem vem *depois* da senha, para não revelar a quem não sabe a senha que a conta existe.
- **O reenvio sempre responde `202`,** para não revelar quais e-mails estão cadastrados.
- **A migration marcou todos os usuários existentes como verificados.**

---

## 12. Login com GitHub

### Como usar

1. Crie um OAuth App em github.com/settings/developers, com callback `http://localhost:3333/auth/github/callback`.
2. Preencha `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`.
3. O front manda o usuário para `GET /auth/github`.
4. Ao final, o usuário volta para `FRONTEND_URL/auth/callback#access_token=<jwt>`. O front lê o token do fragmento (`#`).
5. Em caso de erro, ele volta para `FRONTEND_URL/login?error=invalid_state|github_error|email_not_verified`.

Sem as credenciais configuradas, `GET /auth/github` responde `503`.

### Como foi feito

- **`GitHubOAuthService`** (infra): fluxo authorization code com `fetch`, sem SDK. Busca `/user` e `/user/emails` e só usa o e-mail **principal e verificado**.
- **`AuthenticateWithOAuthUseCase`** (domínio, agnóstico de provedor):
  1. Conta do provedor já vinculada → entra.
  2. Já existe um usuário com aquele e-mail → **vincula** a conta e marca o e-mail como verificado (o provedor provou que a pessoa controla o e-mail).
  3. Nenhum dos dois → cria o usuário sem senha e já verificado.
  - **E-mail não verificado no provedor → recusa.** Isso impede tomar a conta de outra pessoa cadastrando o e-mail dela no GitHub.
- **Tabela `oauth_accounts`** com índice único `(provider, providerAccountId)`. Para adicionar Google: inclua em `OAuthProviderName` e no enum do Prisma.
- **Proteção contra login CSRF:**
  - O `state` é um JWT de 10 min com um nonce.
  - O mesmo nonce fica num cookie `httpOnly`/`SameSite=Lax`.
  - O callback só aceita se os dois baterem (comparação com `timingSafeEqual`).
- **O token vai no fragmento da URL (`#`):** o navegador não o envia ao servidor do front, e ele não aparece em logs de acesso.

---

## 13. Assinatura e limites por plano

### Como usar

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/billing/checkout` | Inicia a assinatura do plano PAID → `{ url }` (redirecione o usuário). `409` se já for PAID |
| `POST` | `/billing/portal` | Portal da Stripe (cartão, faturas, cancelamento) → `{ url }` |
| `GET` | `/billing/subscription` | `{ plan, limits, subscription }` |
| `POST` | `/webhooks/billing` | Webhook da Stripe (público, autenticado pela assinatura) |

**Configurar a Stripe:**
1. Crie um produto com um preço **recorrente** e coloque o `price_...` em `STRIPE_PRICE_ID_PAID`.
2. Ative o Customer Portal no Dashboard.
3. Localmente: `stripe listen --forward-to localhost:3333/webhooks/billing`, e o `whsec_...` mostrado vai em `STRIPE_WEBHOOK_SECRET`.
4. Eventos usados: `customer.subscription.created/updated/deleted` e `invoice.paid`.

**Limites** (`src/domain/user/enterprise/plan-limits.ts`):

| Plano | Mensagens para a IA por dia |
|---|---|
| FREE | 20 |
| PAID | 500 |

Ao passar do limite, a resposta é `429`.

**Rate limit por IP** (`@nestjs/throttler`):

| Escopo | Limite |
|---|---|
| Geral | 100 req/min |
| Login e cadastro | 5 req/min |
| Reenvio de verificação | 3 req/min |
| Mensagens para a IA | 10 req/min |
| GitHub | 10 req/min |
| Webhook | sem limite |

### Como foi feito

- **A porta `PaymentGateway` ganhou** `createCustomer`, `createCheckoutSession`, `createBillingPortalSession` e `parseWebhookEvent`. O último devolve um **`BillingEvent` normalizado** (`subscription.updated` | `invoice.paid`), então o domínio não conhece o formato dos eventos da Stripe.
- **`CreateCheckoutSessionUseCase` cria o customer ANTES do checkout** e o salva em `users.billingCustomerId`. Assim todo webhook encontra o usuário pelo customer, mesmo que os eventos cheguem fora de ordem.
- **As URLs de retorno vêm do `FRONTEND_URL`, nunca do cliente** (evita open redirect).
- **`HandleBillingEventUseCase` é idempotente e resiste a eventos fora de ordem:**
  - Guarda `lastEventAt`, e um evento mais antigo que o estado atual é ignorado.
  - O cancelamento atrasado de uma assinatura *antiga* não derruba a nova.
  - `invoice.paid` vira um `Payment` SUCCEEDED, e o reenvio não duplica (busca por `(provider, externalId)`).
  - `ACTIVE` e `PAST_DUE` dão plano PAID. O `PAST_DUE` mantém o acesso enquanto a Stripe tenta cobrar de novo.
- **Webhook:**
  - O Nest sobe com `rawBody: true`, e a assinatura é validada sobre o body cru (`stripe.webhooks.constructEvent`).
  - Assinatura inválida → `400`.
  - Cliente desconhecido → `200` com log, porque reenviar não resolveria.
- **Tabela `subscriptions`:** uma por usuário, com `status`, `currentPeriodEnd`, `cancelAtPeriodEnd` e `lastEventAt`.
- **Cota da IA:** `MessageRepository.countUserMessagesSince(userId, início do dia UTC)`, verificada *antes* de chamar a IA.
- **Rate limit:** `ThrottlerGuard` global + `@Throttle` nas rotas sensíveis. O `app.set('trust proxy', 1)` faz o `req.ip` ser o IP real atrás do API Gateway.
- **Testado de ponta a ponta** com webhooks assinados de verdade (gerados pelo SDK da Stripe): virar PAID, evento atrasado ignorado, fatura não duplicada, voltar para FREE no cancelamento, 429 na cota.

---

## 14. Documentação da API (Swagger)

### Como usar

- **UI:** http://localhost:3333/docs. Clique em **Authorize** e cole o `access_token`; ele fica salvo entre recargas.
- **OpenAPI JSON:** http://localhost:3333/docs-json (dá para importar no Postman/Insomnia ou gerar um client para o front).

### Como foi feito

- **`@nestjs/swagger` na linha 11.** A 12 já exige NestJS 12.
- **`src/infra/http/swagger/setup-swagger.ts`** monta o documento, com bearer auth.
- **`ApiZodBody(schema)`** gera o body da documentação **a partir do mesmo schema Zod que valida a requisição** (`z.toJSONSchema(..., { target: 'openapi-3.0' })`). Não existe DTO duplicado, então a documentação não fica desatualizada.
- **Cada controller tem `@ApiTags` e `@ApiOperation`.** Os protegidos têm `@ApiBearerAuth`. O `/metrics` fica de fora (`@ApiExcludeController`).

---

## 15. Testes e CI

### Como usar

```bash
npm test                 # 61 testes unitários (~2 s)
npm test -- --coverage   # cobertura (domínio + providers ≈ 87%)

docker compose up -d postgres
npm run test:e2e         # 39 testes E2E (~3 s) contra Postgres real

npm run typecheck
```

O CI (`.github/workflows/ci.yml`) roda em todo push na `master` e em todo PR, com três jobs: `quality`, `e2e` e `migrations`.

**Escrever um teste E2E novo:** crie `src/infra/http/controllers/<area>.e2e-spec.ts`:

```ts
let app: INestApplication
let userFactory: UserFactory

beforeAll(async () => {
  const e2e = await createE2EApp()        // app real + fakes (IA, broker, e-mail, storage)
  app = e2e.app
  userFactory = e2e.userFactory
})

afterAll(() => app.close())

it('...', async () => {
  const user = await userFactory.makePrismaUser({ plan: 'PAID' })   // grava no banco
  const response = await request(app.getHttpServer())
    .get('/me')
    .set('Authorization', `Bearer ${authenticate(app, user)}`)      // JWT sem passar pelo login
  expect(response.status).toBe(200)
})
```

O banco é exclusivo do arquivo, então não precisa limpar nada entre os testes.

### Como foi feito

**Estrutura de `test/`:**

| Pasta | Conteúdo | Usado em |
|---|---|---|
| `test/e2e/` | `global-setup`, `global-teardown`, `setup-e2e`, `database`, `env` | E2E |
| `test/factories/` | `makeUser`/`makePost`/`makeComment`/`makeChat` (entidades) + `UserFactory`/`PostFactory`/`CommentFactory`/`ChatFactory` (gravam via Prisma) | unit + E2E |
| `test/repositories/` | Repositórios em memória (disparam eventos de domínio como os do Prisma) | unit |
| `test/fakes/` | Hasher, encrypter, token, notifier, IA, gateway de pagamento, publisher, **e-mail** | unit + E2E |
| `test/storage/` | `InMemoryStorageGateway` (substitui o S3) | E2E |
| `test/utils/` | `createE2EApp`, `authenticate`, `signedStripeEvent`, `waitFor` | unit + E2E |

**Banco isolado por arquivo:**
1. **`global-setup`** (uma vez por execução) cria o banco `portfolio_e2e_template` e aplica **as mesmas migrations do deploy** (`prisma migrate deploy`, inclusive o `pgvector`).
2. **`setup-e2e`** (uma vez por arquivo) clona o template com `CREATE DATABASE e2e_<uuid> TEMPLATE ...`, o que é muito mais rápido que migrar de novo. Ele aponta o `DATABASE_URL` para o clone e, no fim, faz `DROP DATABASE ... WITH (FORCE)`.
3. **Os arquivos rodam em paralelo** sem um enxergar os dados do outro.
4. **`global-teardown`** apaga o template. Verifiquei: não sobra nenhum banco depois da execução.

**Ambiente (`test/e2e/env.ts`):**
- Tudo é definido explicitamente, e o `ConfigModule` ignora o `.env` quando `NODE_ENV=test`. O resultado não depende da máquina.
- O par de chaves RSA do JWT é gerado na hora, então nenhuma chave fica versionada.

**App de teste (`test/utils/create-e2e-app.ts`):**
- Sobe o `AppModule` **real** (guards, pipes, Prisma, subscribers, middlewares, Swagger) com a mesma `configureApp()` do servidor e da Lambda (`src/infra/configure-app.ts`).
- **Só o que sai da máquina vira fake:** IA, broker, e-mail e storage.
- **A Stripe continua real:**
  - o webhook é validado com assinaturas geradas pelo SDK;
  - só as chamadas de rede (checkout, portal, pagamento) são trocadas com `jest.spyOn`.
- **Rate limit:** desligado por `RATE_LIMIT_DISABLED=true` (o `skipIf` do `ThrottlerModule`). O teste de rate limit religa só para ele.

**O que os E2E cobrem:**

| Arquivo | Cenários |
|---|---|
| `auth` | Cadastro → e-mail com link → login bloqueado (403) → verificação → login. Validação, 409, token de verificação recusado como access token, reenvio sem revelar e-mail, `/me` sem senha, GitHub 503 e state forjado |
| `chat` | Criar chat, pergunta e resposta salvas, chat de outra pessoa 403, ids e body inválidos, cota FREE 429 × PAID 201 |
| `posts` | Criar (401/400), listagem pública paginada com excerpt, detalhe/404, só o autor apaga + cascade nos comentários |
| `comments` | Comentar + **evento `comment.created` publicado** com o autor do post, 404, listagem por post, só o autor apaga |
| `billing` | Checkout cria o customer antes e usa as URLs da config, 409 se já é PAID, portal, ciclo completo via webhook (FREE → PAID → evento atrasado ignorado → FREE), fatura não duplica, assinatura forjada 400, eventos desconhecidos 200 |
| `payments` | Pagamento salvo + `clientPayload` tipado, 502 se a API falhar, validação |
| `platform` | Swagger gerado do Zod e com segurança por rota, `/metrics` com o padrão da rota, rate limit (6ª tentativa de login → 429) |

**Conferi que os testes pegam erro de verdade:** voltando o `password` no `UserPresenter`, o E2E do `/me` falha.

**Testes unitários:**
- Ficam ao lado de cada use case (`*.spec.ts`), com repositórios em memória e fakes.
- **O que cobrem:**
  - autorização por dono;
  - cota e histórico da IA;
  - OAuth;
  - verificação de e-mail;
  - webhook (ordem, idempotência, PAST_DUE);
  - subscribers;
  - tradução dos webhooks da Stripe;
  - métricas do publisher.

**CI:**

| Job | O que faz |
|---|---|
| `quality` | typecheck → testes unitários com cobertura → build → typecheck do CDK |
| `e2e` | Postgres com pgvector como service → `npm run test:e2e` |
| `migrations` | Aplica todas as migrations num banco vazio e falha se o `schema.prisma` mudar sem migration |

O lint segue fora do CI (veja as pendências).

---

## 16. Variáveis de ambiente

A validação fica em `src/infra/env/env.ts`. Credenciais de cada provider só são exigidas quando ele está ativo. Exemplo completo em `.env.example`.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim (na AWS vem do `DB_SECRET_ID`) | Conexão do Postgres |
| `PORT` | não (3333) | Porta do servidor local |
| `GROQ_API_KEY`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` | sim | — |
| `PAYMENT_PROVIDER` | não (`STRIPE`) | API de pagamento ativa |
| `STRIPE_SECRET_KEY` | se `PAYMENT_PROVIDER=STRIPE` | — |
| `STRIPE_WEBHOOK_SECRET` | se `STRIPE` | Valida a assinatura do webhook |
| `STRIPE_PRICE_ID_PAID` | se `STRIPE` | Preço recorrente do plano PAID |
| `FRONTEND_URL` | não (`http://localhost:5173`) | Retorno do checkout/portal, links dos e-mails, redirect do GitHub |
| `EMAIL_PROVIDER` | não (`LOG`) | `LOG` (terminal) ou `SES` |
| `EMAIL_FROM` | não | Remetente dos e-mails |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | não | Sem eles, o login com GitHub responde 503 |
| `GITHUB_CALLBACK_URL` | não (`http://localhost:3333/auth/github/callback`) | Precisa bater com o cadastrado no GitHub |
| `AWS_REGION` | não (`us-east-1`) | Na Lambda é preenchida automaticamente |
| `AWS_ENDPOINT_URL` | não | Só local (LocalStack) |
| `STORAGE_PROVIDER` / `S3_BUCKET` | `S3_BUCKET` se `S3` | — |
| `MESSAGING_PROVIDER` | não (`SQS`) | `SQS` ou `RABBITMQ` |
| `SQS_QUEUE_URL` | se `SQS` | — |
| `RABBITMQ_URL` | se `RABBITMQ` | ex.: `amqp://docker:docker@localhost:5672` |
| `RABBITMQ_EXCHANGE` | não (`portfolio.events`) | Exchange topic onde os eventos são publicados |
| `METRICS_TOKEN` | não | Protege `GET /metrics` |
| `AWS_SECRET_ID` | não | Secret JSON da aplicação |
| `DB_SECRET_ID` | não | Secret do RDS → monta o `DATABASE_URL` |

---

## 17. Pendências conhecidas

- [ ] **`POST /payments` (pagamento avulso) ainda aceita o `amount` do cliente.** A compra de plano já é segura (`/billing/checkout`, preço vindo do servidor). Se o avulso não tiver uso, vale remover a rota.
- [ ] **Lint:** rodar `npx eslint --fix` uma vez (reformata o projeto inteiro, ~1.400 ajustes do Prettier) e depois colocar `npm run lint` no CI.
- [ ] **Refresh token e reset de senha.**
- [ ] **Rate limit em memória:** cada instância da Lambda tem o seu contador. Para um limite global de verdade, use um storage Redis no `ThrottlerModule`.
- [ ] **Healthcheck, logs estruturados com request ID e Sentry.**
- [ ] **LGPD:** termos, política de privacidade e exclusão de conta.
- [ ] **Frontend.**
- [ ] **Outbox Pattern** para publicar eventos (ex.: `payment.created`) com segurança.
- [ ] **Consumidores das filas:** um worker para a `notifications` do RabbitMQ e uma Lambda com event source para a SQS.
- [ ] **O publisher do RabbitMQ espera indefinidamente pela reconexão.** Uma mensagem publicada com o broker fora do ar fica em memória até ele voltar, e se perde se o processo cair nesse meio-tempo. O Outbox resolve isso.
- [ ] **Edição de posts e comentários** (`PUT`), com `updatedAt`.
- [ ] **`OnCommentCreated` busca o post de novo** para descobrir o autor. Daria para levar o `postAuthorId` no evento.
- [ ] **Restringir o CORS** do bucket e da API ao domínio do front.
- [ ] **Validar em uma conta AWS real** o primeiro `cdk deploy` e o `deploy/scripts/migrate.sh`.
