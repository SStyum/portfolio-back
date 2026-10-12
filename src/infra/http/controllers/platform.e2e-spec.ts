import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { UserFactory } from '../../../../test/factories/make-user'
import { authenticate } from '../../../../test/utils/authenticate'
import { createE2EApp } from '../../../../test/utils/create-e2e-app'

let app: INestApplication
let userFactory: UserFactory

describe('Platform: docs, metrics and rate limit (E2E)', () => {
  beforeAll(async () => {
    const e2e = await createE2EApp()
    app = e2e.app
    userFactory = e2e.userFactory
  })

  afterAll(async () => {
    process.env.RATE_LIMIT_DISABLED = 'true'
    await app.close()
  })

  it('[GET] /docs-json documents the API from the Zod schemas', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json')

    expect(response.status).toBe(200)
    expect(response.body.info.title).toBe('Playground de Engenheiro — API')
    expect(response.body.paths['/signup'].post.requestBody.content['application/json'].schema.properties.password.minLength).toBe(8)
    expect(response.body.paths['/posts'].post.security).toEqual([{ 'access-token': [] }])
    expect(response.body.paths['/posts'].get.security).toBeUndefined()
    expect(response.body.paths['/metrics']).toBeUndefined()
  })

  it('[GET] /metrics exposes Prometheus metrics with the route pattern (not the real URL)', async () => {
    const user = await userFactory.makePrismaUser()
    await request(app.getHttpServer()).get('/posts/00000000-0000-4000-8000-000000000000')
    await request(app.getHttpServer()).get('/me').set('Authorization', `Bearer ${authenticate(app, user)}`)

    const response = await request(app.getHttpServer()).get('/metrics')

    expect(response.status).toBe(200)
    expect(response.text).toContain('http_requests_total{method="GET",route="/posts/:postId",status="404"')
    expect(response.text).toContain('http_requests_total{method="GET",route="/me",status="200"')
    expect(response.text).toContain('nodejs_eventloop_lag_seconds')
  })

  it('rate limit: the 6th login attempt within a minute gets 429', async () => {
    process.env.RATE_LIMIT_DISABLED = 'false'

    const statuses: number[] = []
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await request(app.getHttpServer()).post('/sessions').send({ email: 'brute@e2e.test', password: 'wrong-pass' })
      statuses.push(response.status)
    }

    expect(statuses).toEqual([401, 401, 401, 401, 401, 429])
    process.env.RATE_LIMIT_DISABLED = 'true'
  })
})
