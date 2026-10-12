import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../database/prisma/prisma.service'
import { FakeMessagePublisher } from '../../../../test/fakes/fake-message-publisher'
import { CommentFactory } from '../../../../test/factories/make-comment'
import { PostFactory } from '../../../../test/factories/make-post'
import { UserFactory } from '../../../../test/factories/make-user'
import { authenticate } from '../../../../test/utils/authenticate'
import { createE2EApp } from '../../../../test/utils/create-e2e-app'
import { waitFor } from '../../../../test/utils/wait-for'

let app: INestApplication
let prisma: PrismaService
let publisher: FakeMessagePublisher
let userFactory: UserFactory
let postFactory: PostFactory
let commentFactory: CommentFactory

describe('Comments (E2E)', () => {
  beforeAll(async () => {
    const e2e = await createE2EApp()
    app = e2e.app
    publisher = e2e.fakes.publisher
    userFactory = e2e.userFactory
    postFactory = e2e.postFactory
    commentFactory = e2e.commentFactory
    prisma = app.get(PrismaService)
  })

  afterAll(async () => {
    await app.close()
  })

  it('[POST] /posts/:id/comments creates the comment and publishes comment.created', async () => {
    const author = await userFactory.makePrismaUser()
    const reader = await userFactory.makePrismaUser()
    const post = await postFactory.makePrismaPost({ authorId: author.id })

    const response = await request(app.getHttpServer())
      .post(`/posts/${post.id.toString()}/comments`)
      .set('Authorization', `Bearer ${authenticate(app, reader)}`)
      .send({ content: 'Ótimo post!' })

    expect(response.status).toBe(201)
    expect(await prisma.comment.findUnique({ where: { id: response.body.comment.id } })).toMatchObject({ content: 'Ótimo post!' })

    // Evento de domínio → subscriber → broker, depois de salvar
    await waitFor(() => expect(publisher.published).toHaveLength(1))
    expect(publisher.published[0]).toMatchObject({
      topic: 'comment.created',
      payload: {
        commentId: response.body.comment.id,
        postAuthorId: author.id.toString(),
        commentAuthorId: reader.id.toString(),
      },
    })
  })

  it('returns 404 when commenting on a post that does not exist', async () => {
    const reader = await userFactory.makePrismaUser()

    const response = await request(app.getHttpServer())
      .post('/posts/00000000-0000-4000-8000-000000000000/comments')
      .set('Authorization', `Bearer ${authenticate(app, reader)}`)
      .send({ content: 'oi' })

    expect(response.status).toBe(404)
  })

  it('[GET] /posts/:id/comments lists only that post\'s comments (public)', async () => {
    const author = await userFactory.makePrismaUser()
    const post = await postFactory.makePrismaPost({ authorId: author.id })
    const otherPost = await postFactory.makePrismaPost({ authorId: author.id })
    await commentFactory.makePrismaComment({ postId: post.id, authorId: author.id, content: 'primeiro' })
    await commentFactory.makePrismaComment({ postId: post.id, authorId: author.id, content: 'segundo' })
    await commentFactory.makePrismaComment({ postId: otherPost.id, authorId: author.id })

    const response = await request(app.getHttpServer()).get(`/posts/${post.id.toString()}/comments`)

    expect(response.status).toBe(200)
    expect(response.body.comments.map((c: { content: string }) => c.content).sort()).toEqual(['primeiro', 'segundo'])
  })

  it('[DELETE] /comments/:id only the author can delete', async () => {
    const author = await userFactory.makePrismaUser()
    const other = await userFactory.makePrismaUser()
    const post = await postFactory.makePrismaPost({ authorId: author.id })
    const comment = await commentFactory.makePrismaComment({ postId: post.id, authorId: author.id })

    const byOther = await request(app.getHttpServer()).delete(`/comments/${comment.id.toString()}`).set('Authorization', `Bearer ${authenticate(app, other)}`)
    const byAuthor = await request(app.getHttpServer()).delete(`/comments/${comment.id.toString()}`).set('Authorization', `Bearer ${authenticate(app, author)}`)
    const again = await request(app.getHttpServer()).delete(`/comments/${comment.id.toString()}`).set('Authorization', `Bearer ${authenticate(app, author)}`)

    expect([byOther.status, byAuthor.status, again.status]).toEqual([403, 204, 404])
  })
})
