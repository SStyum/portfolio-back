import { z } from "zod";
import { PAYMENT_PROVIDERS } from "../../domain/payment/enterprise/entities/payment";
import { STORAGE_PROVIDERS } from "../../core/gateways/storage.gateway";
import { MESSAGING_PROVIDERS } from "../../core/gateways/message-publisher";
import { EMAIL_PROVIDERS } from "../../core/gateways/email-sender";

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().optional().default(3333),

  GROQ_API_KEY: z.string(),

  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),

  PAYMENT_PROVIDER: z.enum(PAYMENT_PROVIDERS).default("STRIPE"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Price da Stripe do plano PAID (assinatura recorrente)
  STRIPE_PRICE_ID_PAID: z.string().optional(),

  // Pra onde a Stripe/GitHub redirecionam o usuário de volta
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  // Na Lambda o AWS_REGION é preenchido automaticamente
  AWS_REGION: z.string().default("us-east-1"),
  // Só pra dev local com LocalStack (ex.: http://localhost:4566)
  AWS_ENDPOINT_URL: z.string().url().optional(),

  STORAGE_PROVIDER: z.enum(STORAGE_PROVIDERS).default("S3"),
  S3_BUCKET: z.string().optional(),

  MESSAGING_PROVIDER: z.enum(MESSAGING_PROVIDERS).default("SQS"),
  SQS_QUEUE_URL: z.string().url().optional(),
  RABBITMQ_URL: z.string().url().optional(),
  RABBITMQ_EXCHANGE: z.string().default("portfolio.events"),

  // LOG = escreve o e-mail no terminal (dev) | SES = envia de verdade
  EMAIL_PROVIDER: z.enum(EMAIL_PROVIDERS).default("LOG"),
  EMAIL_FROM: z.string().default("Playground de Engenheiro <no-reply@localhost>"),

  // Login com GitHub (opcional: sem isso, GET /auth/github responde 503)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().default("http://localhost:3333/auth/github/callback"),

  // Se definido, GET /metrics exige "Authorization: Bearer <METRICS_TOKEN>"
  METRICS_TOKEN: z.string().optional(),

}).superRefine((env, ctx) => {
  // Cada provider exige as próprias credenciais só quando estiver ativo
  const required: [boolean, keyof typeof env, string][] = [
    [env.PAYMENT_PROVIDER === "STRIPE", "STRIPE_SECRET_KEY", "PAYMENT_PROVIDER=STRIPE"],
    [env.PAYMENT_PROVIDER === "STRIPE", "STRIPE_WEBHOOK_SECRET", "PAYMENT_PROVIDER=STRIPE"],
    [env.PAYMENT_PROVIDER === "STRIPE", "STRIPE_PRICE_ID_PAID", "PAYMENT_PROVIDER=STRIPE"],
    [env.STORAGE_PROVIDER === "S3", "S3_BUCKET", "STORAGE_PROVIDER=S3"],
    [env.MESSAGING_PROVIDER === "SQS", "SQS_QUEUE_URL", "MESSAGING_PROVIDER=SQS"],
    [env.MESSAGING_PROVIDER === "RABBITMQ", "RABBITMQ_URL", "MESSAGING_PROVIDER=RABBITMQ"],
  ]

  for (const [active, key, provider] of required) {
    if (active && !env[key]) {
      ctx.addIssue({
        code: "custom",
        path: [key],
        message: `${key} is required when ${provider}`,
      })
    }
  }
})

export type Env = z.infer<typeof envSchema>
