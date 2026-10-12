import { Message, MessagePublisher } from '../../src/core/gateways/message-publisher'

export class FakeMessagePublisher implements MessagePublisher {
  public published: Message[] = []
  public shouldFail = false

  async publish<T>(message: Message<T>) {
    if (this.shouldFail) {
      throw new Error('broker down')
    }

    this.published.push(message)
  }
}
