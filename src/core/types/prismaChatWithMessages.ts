import { Prisma } from "@prisma/client"

export type PrismaChatWithMessages = Prisma.ChatGetPayload<{
  include: {
    messages: true
  }
}>