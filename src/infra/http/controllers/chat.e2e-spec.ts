import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../database/prisma/prisma.service'
import { FakeAiService } from '../../../../test/fakes/fake-ai-service'
import { ChatFactory } from '../../../../test/factories/make-chat'
import { UserFactory } from '../../../../test/factories/make-user'
import { authenticate } from '../../../../test/utils/authenticate'
import { createE2EApp } from '../../../../test/utils/create-e2e-app'

let app: INestApplication
let prisma: PrismaService
let ai: FakeAiService
let userFactory: UserFactory
let chatFactory: ChatFactory

describe('AI Chat (E2E)', () => {
  beforeAll(async () => {
    const e2e = await createE2EApp()
    app = e2e.app
    ai = e2e.fakes.ai
    userFactory = e2e.userFactory
    chatFactory = e2e.chatFactory
    prisma = app.get(PrismaService)
  })

  afterAll(async () => {
    await app.close()
  })

  it('[POST] /chats creates a chat for the logged user', async () => {
    const user = await userFactory.makePrismaUser()

    const response = await request(app.getHttpServer())
      .post('/chats')
      .set('Authorization', `Bearer ${authenticate(app, user)}`)

    expect(response.status).toBe(201)
    expect(await prisma.chat.findUnique({ where: { id: response.body.chatId } })).toMatchObject({ userId: user.id.toString() })
  })

  it('[POST] /chat/:id/messages stores the question and the AI answer', async () => {
    const user = await userFactory.makePrismaUser()
    const chat = await chatFactory.makePrismaChat({ userId: user.id.toString() })

    const response = await request(app.getHttpServer())
      .post(`/chat/${chat.id.toString()}/messages`)
      .set('Authorization', `Bearer ${authenticate(app, user)}`)
      .send({ content: 'O que é DDD?' })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ answer: 'resposta da IA' })
    expect(ai.calls.at(-1)?.at(-1)).toEqual({ role: 'user', content: 'O que é DDD?' })

    const messages = await prisma.message.findMany({ where: { chatId: chat.id.toString() }, orderBy: { createdAt: 'asc' } })
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant'])
  })

  it('does not allow sending messages to someone else\'s chat (403)', async () => {
    const owner = await userFactory.makePrismaUser()
    const intruder = await userFactory.makePrismaUser()
    const chat = await chatFactory.makePrismaChat({ userId: owner.id.toString() })

    const response = await request(app.getHttpServer())
      .post(`/chat/${chat.id.toString()}/messages`)
      .set('Authorization', `Bearer ${authenticate(app, intruder)}`)
      .send({ content: 'oi' })

    expect(response.status).toBe(403)
  })

  it('validates chat id and body', async () => {
    const user = await userFactory.makePrismaUser()
    const token = authenticate(app, user)

    const invalidId = await request(app.getHttpServer()).post('/chat/not-a-uuid/messages').set('Authorization', `Bearer ${token}`).send({ content: 'oi' })
    const missingChat = await request(app.getHttpServer()).post('/chat/00000000-0000-4000-8000-000000000000/messages').set('Authorization', `Bearer ${token}`).send({ content: 'oi' })
    const emptyBody = await request(app.getHttpServer()).post('/chat/00000000-0000-4000-8000-000000000000/messages').set('Authorization', `Bearer ${token}`).send({})

    expect([invalidId.status, missingChat.status, emptyBody.status]).toEqual([400, 404, 400])
  })

  it('enforces the daily quota of the FREE plan (429) but not for PAID', async () => {
    const free = await userFactory.makePrismaUser({ plan: 'FREE' })
    const paid = await userFactory.makePrismaUser({ plan: 'PAID' })
    const freeChat = await chatFactory.makePrismaChat({ userId: free.id.toString() })
    const paidChat = await chatFactory.makePrismaChat({ userId: paid.id.toString() })
    await chatFactory.makePrismaUserMessages(freeChat.id.toString(), 20)
    await chatFactory.makePrismaUserMessages(paidChat.id.toString(), 20)

    const freeResponse = await request(app.getHttpServer())
      .post(`/chat/${freeChat.id.toString()}/messages`)
      .set('Authorization', `Bearer ${authenticate(app, free)}`)
      .send({ content: 'mais uma' })

    const paidResponse = await request(app.getHttpServer())
      .post(`/chat/${paidChat.id.toString()}/messages`)
      .set('Authorization', `Bearer ${authenticate(app, paid)}`)
      .send({ content: 'mais uma' })

    expect(freeResponse.status).toBe(429)
    expect(paidResponse.status).toBe(201)
  })
})
