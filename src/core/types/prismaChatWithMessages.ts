import { Prisma } from "../../generated/prisma/client"

export type PrismaChatWithMessages = Prisma.ChatGetPayload<{
  include: {
    messages: true
  }
}>