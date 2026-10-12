import { Test } from '@nestjs/testing'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AiService } from '../../src/domain/AI/application/gateway/ai.gateway'
import { EmailSender } from '../../src/core/gateways/email-sender'
import { MessagePublisher } from '../../src/core/gateways/message-publisher'
import { StorageGateway } from '../../src/core/gateways/storage.gateway'
import { AppModule } from '../../src/infra/app.module'
import { configureApp } from '../../src/infra/configure-app'
import { DatabaseModule } from '../../src/infra/database/database.module'
import { FakeAiService } from '../fakes/fake-ai-service'
import { FakeEmailSender } from '../fakes/fake-email-sender'
import { FakeMessagePublisher } from '../fakes/fake-message-publisher'
import { ChatFactory } from '../factories/make-chat'
import { CommentFactory } from '../factories/make-comment'
import { PostFactory } from '../factories/make-post'
import { UserFactory } from '../factories/make-user'
import { InMemoryStorageGateway } from '../storage/in-memory-storage-gateway'

/**
 * Sobe a app real (módulos, guards, pipes, Prisma, middlewares, Swagger) contra o banco do teste.
 * Só o que sai da máquina vira fake: IA, broker, e-mail e storage.
 * A Stripe continua real: o webhook é validado com assinaturas geradas pelo SDK, e as chamadas
 * de rede (checkout, portal) são substituídas com jest.spyOn em cada teste.
 */
export async function createE2EApp() {
  const fakes = {
    ai: new FakeAiService(),
    publisher: new FakeMessagePublisher(),
    emailSender: new FakeEmailSender(),
    storage: new InMemoryStorageGateway(),
  }

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule, DatabaseModule],
    providers: [UserFactory, PostFactory, CommentFactory, ChatFactory],
  })
    .overrideProvider(AiService).useValue(fakes.ai)
    .overrideProvider(MessagePublisher).useValue(fakes.publisher)
    .overrideProvider(EmailSender).useValue(fakes.emailSender)
    .overrideProvider(StorageGateway).useValue(fakes.storage)
    .compile()

  const app = moduleRef.createNestApplication<NestExpressApplication>({ rawBody: true, logger: false })
  configureApp(app)
  await app.init()

  return {
    app,
    fakes,
    userFactory: moduleRef.get(UserFactory),
    postFactory: moduleRef.get(PostFactory),
    commentFactory: moduleRef.get(CommentFactory),
    chatFactory: moduleRef.get(ChatFactory),
  }
}
