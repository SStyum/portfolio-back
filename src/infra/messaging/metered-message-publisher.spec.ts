import { FakeMessagePublisher } from '../../../test/fakes/fake-message-publisher'
import { messagesPublishedTotal } from '../metrics/metrics'
import { MeteredMessagePublisher } from './metered-message-publisher'

const count = async (result: string) =>
  (await messagesPublishedTotal.get()).values.find((v) => v.labels.result === result && v.labels.topic === 'test.topic')?.value ?? 0

describe('Metered message publisher', () => {
  it('counts successes and failures and rethrows errors', async () => {
    const inner = new FakeMessagePublisher()
    const sut = new MeteredMessagePublisher(inner, 'RABBITMQ')

    await sut.publish({ topic: 'test.topic', payload: {} })
    inner.shouldFail = true
    await expect(sut.publish({ topic: 'test.topic', payload: {} })).rejects.toThrow('broker down')

    expect(await count('success')).toBe(1)
    expect(await count('error')).toBe(1)
  })
})
