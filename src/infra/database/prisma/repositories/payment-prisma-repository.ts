import { Injectable } from "@nestjs/common";
import { PaymentsRepository } from "../../../../domain/payment/application/repository/payments-repository";
import { Payment, PaymentProviderName } from "../../../../domain/payment/enterprise/entities/payment";
import { PrismaPaymentMapper } from "../mapper/prisma-payment-mapper";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaPaymentsRepository implements PaymentsRepository {

  constructor(private prisma: PrismaService) {}

  async create(payment: Payment): Promise<void> {
    const data = PrismaPaymentMapper.toPrisma(payment)

    await this.prisma.payment.create({
      data
    })
  }

  async findById(id: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: {
        id
      }
    })

    if (!payment) {
      return null
    }

    return PrismaPaymentMapper.toDomain(payment)
  }

  async findByExternalId(provider: PaymentProviderName, externalId: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: {
        provider_externalId: {
          provider,
          externalId
        }
      }
    })

    if (!payment) {
      return null
    }

    return PrismaPaymentMapper.toDomain(payment)
  }

  async findManyByUserId(userId: string): Promise<Payment[]> {
    const payments = await this.prisma.payment.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return payments.map(PrismaPaymentMapper.toDomain)
  }

  async save(payment: Payment): Promise<void> {
    const data = PrismaPaymentMapper.toPrisma(payment)

    await this.prisma.payment.update({
      where: {
        id: payment.id.toString()
      },
      data
    })
  }
}
