import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../database/prisma/prisma.service'
import { FakeEmailSender } from '../../../../test/fakes/fake-email-sender'
import { UserFactory } from '../../../../test/factories/make-user'
import { authenticate } from '../../../../test/utils/authenticate'
import { createE2EApp } from '../../../../test/utils/create-e2e-app'
import { waitFor } from '../../../../test/utils/wait-for'

let app: INestApplication
let prisma: PrismaService
let emailSender: FakeEmailSender
let userFactory: UserFactory

// Token que veio no link do e-mail de verificação
function verificationTokenSentTo(email: string) {
  const link = emailSender.lastTo(email)?.text.match(/verify-email\?token=(\S+)/)?.[1]
  return link && decodeURIComponent(link)
}

describe('Auth (E2E)', () => {
  beforeAll(async () => {
    const e2e = await createE2EApp()
    app = e2e.app
    emailSender = e2e.fakes.emailSender
    userFactory = e2e.userFactory
    prisma = app.get(PrismaService)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('[POST] /signup', () => {
    it('creates an unverified account and sends the verification e-mail', async () => {
      const response = await request(app.getHttpServer()).post('/signup').send({
        name: 'Ana', email: 'ana@e2e.test', password: '12345678',
      })

      expect(response.status).toBe(201)

      const user = await prisma.user.findUnique({ where: { email: 'ana@e2e.test' } })
      expect(user).toMatchObject({ plan: 'FREE', role: 'USER', emailVerifiedAt: null })
      expect(user?.password).not.toBe('12345678')

      await waitFor(() => expect(verificationTokenSentTo('ana@e2e.test')).toBeTruthy())
      expect(emailSender.lastTo('ana@e2e.test')?.text).toContain('http://front.e2e/verify-email?token=')
    })

    it('validates the body (password with at least 8 characters)', async () => {
      const response = await request(app.getHttpServer()).post('/signup').send({
        name: 'Ana', email: 'short@e2e.test', password: '123',
      })

      expect(response.status).toBe(400)
    })

    it('returns 409 for an e-mail already in use', async () => {
      await userFactory.makePrismaUser({ email: 'taken@e2e.test' })

      const response = await request(app.getHttpServer()).post('/signup').send({
        name: 'Ana', email: 'taken@e2e.test', password: '12345678',
      })

      expect(response.status).toBe(409)
    })
  })

  describe('e-mail verification + [POST] /sessions', () => {
    it('blocks login until the e-mail is verified, then lets the user in', async () => {
      const server = app.getHttpServer()
      await request(server).post('/signup').send({ name: 'Bia', email: 'bia@e2e.test', password: '12345678' })
      await waitFor(() => expect(verificationTokenSentTo('bia@e2e.test')).toBeTruthy())

      const beforeVerification = await request(server).post('/sessions').send({ email: 'bia@e2e.test', password: '12345678' })
      expect(beforeVerification.status).toBe(403)

      const verification = await request(server).post('/auth/verify-email').send({ token: verificationTokenSentTo('bia@e2e.test') })
      expect(verification.status).toBe(204)

      const afterVerification = await request(server).post('/sessions').send({ email: 'bia@e2e.test', password: '12345678' })
      expect(afterVerification.status).toBe(200)
      expect(afterVerification.body.access_token).toEqual(expect.any(String))
    })

    it('rejects an invalid verification token', async () => {
      const response = await request(app.getHttpServer()).post('/auth/verify-email').send({ token: 'garbage' })

      expect(response.status).toBe(400)
    })

    it('does not accept the verification token as an access token', async () => {
      await request(app.getHttpServer()).post('/signup').send({ name: 'Cris', email: 'cris@e2e.test', password: '12345678' })
      await waitFor(() => expect(verificationTokenSentTo('cris@e2e.test')).toBeTruthy())

      const response = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${verificationTokenSentTo('cris@e2e.test')}`)

      expect(response.status).toBe(401)
    })

    it('returns 401 for wrong credentials', async () => {
      await userFactory.makePrismaUser({ email: 'dan@e2e.test', plainPassword: '12345678' })

      const response = await request(app.getHttpServer()).post('/sessions').send({ email: 'dan@e2e.test', password: 'wrong-pass' })

      expect(response.status).toBe(401)
    })
  })

  describe('[POST] /auth/resend-verification', () => {
    it('always answers 202 (does not reveal registered e-mails)', async () => {
      const response = await request(app.getHttpServer()).post('/auth/resend-verification').send({ email: 'nobody@e2e.test' })

      expect(response.status).toBe(202)
      expect(emailSender.lastTo('nobody@e2e.test')).toBeUndefined()
    })
  })

  describe('[GET] /me', () => {
    it('returns the logged user without the password', async () => {
      const user = await userFactory.makePrismaUser({ name: 'Eva', plan: 'PAID' })

      const response = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${authenticate(app, user)}`)

      expect(response.status).toBe(200)
      expect(response.body.user).toEqual({
        id: user.id.toString(), name: 'Eva', email: user.email, plan: 'PAID', role: 'USER',
      })
    })

    it('requires authentication', async () => {
      const response = await request(app.getHttpServer()).get('/me')

      expect(response.status).toBe(401)
    })
  })

  describe('[GET] /auth/github', () => {
    it('answers 503 while GitHub login is not configured', async () => {
      const response = await request(app.getHttpServer()).get('/auth/github')

      expect(response.status).toBe(503)
    })

    it('rejects a callback with a forged state', async () => {
      const response = await request(app.getHttpServer()).get('/auth/github/callback?code=x&state=forged')

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe('http://front.e2e/login?error=invalid_state')
    })
  })
})
