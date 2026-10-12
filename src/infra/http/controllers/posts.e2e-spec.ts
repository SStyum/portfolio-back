import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../database/prisma/prisma.service'
import { CommentFactory } from '../../../../test/factories/make-comment'
import { PostFactory } from '../../../../test/factories/make-post'
import { UserFactory } from '../../../../test/factories/make-user'
import { authenticate } from '../../../../test/utils/authenticate'
import { createE2EApp } from '../../../../test/utils/create-e2e-app'

let app: INestApplication
let prisma: PrismaService
let userFactory: UserFactory
let postFactory: PostFactory
let commentFactory: CommentFactory

describe('Posts (E2E)', () => {
  beforeAll(async () => {
    const e2e = await createE2EApp()
    app = e2e.app
    userFactory = e2e.userFactory
    postFactory = e2e.postFactory
    commentFactory = e2e.commentFactory
    prisma = app.get(PrismaService)
  })

  afterAll(async () => {
    await app.close()
  })

  it('[POST] /posts creates a post (authenticated)', async () => {
    const author = await userFactory.makePrismaUser()

    const response = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${authenticate(app, author)}`)
      .send({ title: 'Clean Architecture', content: 'Camadas e dependências' })

    expect(response.status).toBe(201)
    expect(response.body.post).toMatchObject({ title: 'Clean Architecture', authorId: author.id.toString() })
    expect(await prisma.post.count({ where: { userId: author.id.toString() } })).toBe(1)
  })

  it('[POST] /posts requires authentication and a valid body', async () => {
    const author = await userFactory.makePrismaUser()

    const anonymous = await request(app.getHttpServer()).post('/posts').send({ title: 'x', content: 'y' })
    const invalid = await request(app.getHttpServer()).post('/posts').set('Authorization', `Bearer ${authenticate(app, author)}`).send({ title: '' })

    expect(anonymous.status).toBe(401)
    expect(invalid.status).toBe(400)
  })

  it('[GET] /posts lists recent posts publicly, 20 per page, with excerpt', async () => {
    const author = await userFactory.makePrismaUser()
    await Promise.all(Array.from({ length: 22 }, (_, i) =>
      postFactory.makePrismaPost({ authorId: author.id, title: `post ${i}`, content: 'x'.repeat(200), createdAt: new Date(2030, 0, i + 1) }),
    ))

    const page1 = await request(app.getHttpServer()).get('/posts?page=1')
    const page2 = await request(app.getHttpServer()).get('/posts?page=2')
    const invalidPage = await request(app.getHttpServer()).get('/posts?page=0')

    expect(page1.status).toBe(200)
    expect(page1.body.posts).toHaveLength(20)
    expect(page1.body.posts[0]).toMatchObject({ title: 'post 21', excerpt: expect.stringMatching(/\.\.\.$/) })
    expect(page1.body.posts[0]).not.toHaveProperty('content')
    expect(page2.body.posts.length).toBeGreaterThanOrEqual(2)
    expect(invalidPage.status).toBe(400)
  })

  it('[GET] /posts/:id returns the full post or 404', async () => {
    const post = await postFactory.makePrismaPost({ authorId: (await userFactory.makePrismaUser()).id })

    const found = await request(app.getHttpServer()).get(`/posts/${post.id.toString()}`)
    const missing = await request(app.getHttpServer()).get('/posts/00000000-0000-4000-8000-000000000000')

    expect(found.status).toBe(200)
    expect(found.body.post).toMatchObject({ id: post.id.toString(), content: post.content })
    expect(missing.status).toBe(404)
  })

  it('[DELETE] /posts/:id only the author can delete, and comments go with it', async () => {
    const author = await userFactory.makePrismaUser()
    const other = await userFactory.makePrismaUser()
    const post = await postFactory.makePrismaPost({ authorId: author.id })
    await commentFactory.makePrismaComment({ postId: post.id, authorId: other.id })

    const byOther = await request(app.getHttpServer()).delete(`/posts/${post.id.toString()}`).set('Authorization', `Bearer ${authenticate(app, other)}`)
    const byAuthor = await request(app.getHttpServer()).delete(`/posts/${post.id.toString()}`).set('Authorization', `Bearer ${authenticate(app, author)}`)

    expect(byOther.status).toBe(403)
    expect(byAuthor.status).toBe(204)
    expect(await prisma.post.findUnique({ where: { id: post.id.toString() } })).toBeNull()
    expect(await prisma.comment.count({ where: { postId: post.id.toString() } })).toBe(0)
  })
})
