import { Prisma, Payment as PrismaPayment } from '@prisma/client'
import { Payment } from '../../../../domain/payment/enterprise/entities/payment';
import { PaymentStatus, PaymentProvider } from '../../../../domain/payment/enterprise/entities/payment';

import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'



export class PrismaPaymentMapper {
  static toDomain(raw: PrismaPayment): Payment {
    return Payment.create({
      eventId: '',
      userId: new UniqueEntityId(raw.userId),
      stripePaymentIntentId: raw.stripePaymentIntentId || ' ',
      stripeCustomerId: raw.stripeCustomerId || '',
      amount: raw.amount,
      currency: raw.currency,
      status: raw.status as unknown as PaymentStatus,
      provider: raw.provider as unknown as PaymentProvider,
      metadata: raw.metadata
        ? (raw.metadata as Record<string, unknown>)
        : undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
      new UniqueEntityId(raw.id)
    );
  }

  /**
   * Converte a entidade de domínio para o formato que o Prisma espera no create/update.
   */
  static toPrisma(payment: Payment): Omit<PrismaPayment, 'user'> {
    return {
      id: payment.id.toString(),
      userId: payment.userId.toString(),
      stripePaymentIntentId: payment.stripePaymentIntentId ?? null,
      stripeCustomerId: payment.stripeCustomerId ?? null,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      metadata: payment.metadata as Prisma.JsonValue,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt ?? new Date(),
      eventId: '' //TODO WEBHOOK
    };
  }
}