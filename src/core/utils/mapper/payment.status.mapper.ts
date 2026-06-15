import { PaymentStatus } from "../../../generated/prisma/enums";

export class StripeStatusMapper {

  static toDomain(status: string): PaymentStatus {

    switch (status) {

      case "requires_payment_method":
      case "requires_confirmation":
      case "requires_action":
        return "PENDING";

      case "processing":
        return "PROCESSING";

      case "succeeded":
        return "SUCCEEDED";

      case "canceled":
        return "CANCELED";

      default:
        return "FAILED";
    }
  }
}