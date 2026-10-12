import { Entity } from "../../../../core/entities/entity";
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id";
import { PaymentProviderName } from "./payment";

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "INCOMPLETE" | "CANCELED"

interface SubscriptionProps {
  userId: UniqueEntityId
  provider: PaymentProviderName
  externalId: string
  status: SubscriptionStatus
  currentPeriodEnd?: Date
  cancelAtPeriodEnd: boolean
  lastEventAt: Date
  createdAt: Date
  updatedAt?: Date
}

export class Subscription extends Entity<SubscriptionProps> {
  get userId() {
    return this.props.userId
  }

  get provider() {
    return this.props.provider
  }

  get externalId() {
    return this.props.externalId
  }

  get status() {
    return this.props.status
  }

  get currentPeriodEnd() {
    return this.props.currentPeriodEnd
  }

  get cancelAtPeriodEnd() {
    return this.props.cancelAtPeriodEnd
  }

  get lastEventAt() {
    return this.props.lastEventAt
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  // PAST_DUE mantém o acesso enquanto a API tenta cobrar de novo
  get grantsPaidPlan() {
    return this.props.status === "ACTIVE" || this.props.status === "PAST_DUE"
  }

  apply(update: Pick<SubscriptionProps, 'externalId' | 'status' | 'currentPeriodEnd' | 'cancelAtPeriodEnd' | 'lastEventAt'>) {
    Object.assign(this.props, update)
    this.props.updatedAt = new Date()
  }

  static create(props: Omit<SubscriptionProps, 'createdAt'> & { createdAt?: Date }, id?: UniqueEntityId) {
    return new Subscription({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    }, id)
  }
}
