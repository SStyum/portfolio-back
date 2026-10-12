import { Prisma, Payment as PrismaPayment } from '@prisma/client'
import { Payment } from '../../../../domain/payment/enterprise/entities/payment';
import { PaymentStatus, PaymentProviderName } from '../../../../domain/payment/enterprise/entities/payment';

import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'

export class PrismaPaymentMapper {
  static toDomain(raw: PrismaPayment): Payment {
    return Payment.create({
      eventId: raw.eventId ?? undefined,
      userId: new UniqueEntityId(raw.userId),
      externalId: raw.externalId,
      externalCustomerId: raw.externalCustomerId ?? undefined,
      amount: raw.amount,
      currency: raw.currency,
      status: raw.status as PaymentStatus,
      provider: raw.provider as PaymentProviderName,
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
  static toPrisma(payment: Payment): Prisma.PaymentUncheckedCreateInput {
    return {
      id: payment.id.toString(),
      userId: payment.userId.toString(),
      externalId: payment.externalId,
      externalCustomerId: payment.externalCustomerId ?? null,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      metadata: payment.metadata as Prisma.InputJsonValue,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt ?? new Date(),
      // eventId é @unique — null até o webhook preencher (string vazia colidiria no 2º pagamento)
      eventId: payment.eventId || null,
    };
  }
}
