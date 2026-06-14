// domain/payment/enterprise/entities/payment.ts

import { Entity } from "../../../../core/entities/entity";
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id";

// Status do domínio — não da Stripe, ainda sem webhook 
//TODO WEBHOOKS to type paymentStatus
export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED"
  | "REFUNDED";

export type PaymentProvider = "STRIPE" ;

interface PaymentProps {
  userId: string;
  provider: PaymentProvider;

  // ID externo genérico — pode ser da Stripe, MercadoPago, etc.
  stripePaymentIntentId: string;
  stripeCustomerId?: string;

  amount: number;
  currency: string;
  status: PaymentStatus;

  // Opaco pro domínio — cada provider retorna o que precisa pro frontend
  clientSecret?: string;
  metadata?: Record<string, unknown>;

  // TO DO
  eventId: string

  createdAt: Date;
  updatedAt?: Date;
}

export class Payment extends Entity<PaymentProps> {

  get userId() {
    return this.props.userId
  }

  get provider() {
    return this.props.provider
  }

  get stripePaymentIntentId() {
    return this.props.stripePaymentIntentId
  }

  get stripeCustomerId() {
    return this.props.stripeCustomerId
  }

  get amount() {
    return this.props.amount
  }

  get amountFormatted() {
    return this.props.amount / 100
  }

  get currency() {
    return this.props.currency
  }

  get status() {
    return this.props.status
  }

  get clientSecret() {
    return this.props.clientSecret
  }

  get metadata() {
    return this.props.metadata ?? {}
  }

  get createdAt() {
    return this.props.createdAt
  }
  
  get updatedAt() {
    return this.props.updatedAt
  }

  get isSucceeded() { return this.props.status === "SUCCEEDED" }
  get isCanceled() { return this.props.status === "CANCELED" }
  get isPending() {
    return this.props.status === "PENDING" || this.props.status === "PROCESSING"
  }

  updateStatus(newStatus: PaymentStatus) {
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  static create(props: PaymentProps, id?: UniqueEntityId) {
    return new Payment(props, id);
  }
}