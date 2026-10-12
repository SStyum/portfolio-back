import { z } from "zod";
import { PAYMENT_PROVIDERS } from "../../domain/payment/enterprise/entities/payment";

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().optional().default(3333),

  GROQ_API_KEY: z.string(),

  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),

  PAYMENT_PROVIDER: z.enum(PAYMENT_PROVIDERS).default("STRIPE"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

})

export type Env = z.infer<typeof envSchema>