import { Payment, PaymentProviderName } from "../../enterprise/entities/payment";

export abstract class PaymentsRepository {
    abstract create(payment: Payment): Promise<void>;
    abstract findById(id: string): Promise<Payment | null>;
    // O externalId só é único dentro de um mesmo provider
    abstract findByExternalId(provider: PaymentProviderName, externalId: string): Promise<Payment | null>;
    abstract findManyByUserId(userId: string): Promise<Payment[]>;
    abstract save(payment: Payment): Promise<void>;
}
