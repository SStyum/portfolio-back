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

// Para adicionar uma API nova: inclua aqui, no enum do Prisma e registre o gateway em payment.module.ts
export const PAYMENT_PROVIDERS = ["STRIPE"] as const;
export type PaymentProviderName = typeof PAYMENT_PROVIDERS[number];

interface PaymentProps {
  userId: UniqueEntityId;
  provider: PaymentProviderName;

  // ID externo genérico — pode ser da Stripe, MercadoPago, etc.
  externalId: string;
  externalCustomerId?: string;

  amount: number;
  currency: string;
  status: PaymentStatus;

  metadata?: Record<string, unknown>;

  // TO DO
  eventId?: string

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

  get externalId() {
    return this.props.externalId
  }

  get externalCustomerId() {
    return this.props.externalCustomerId
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

  get metadata() {
    return this.props.metadata ?? {}
  }

  get eventId() {
    return this.props.eventId
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