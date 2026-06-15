import { Payment } from "../../enterprise/entities/payment";

export abstract class PaymentsRepository {
    abstract create(payment: Payment): Promise<void>;
    abstract findByExternalId(id: string): Promise<Payment | null>;
    abstract save(payment: Payment): Promise<void>;
}