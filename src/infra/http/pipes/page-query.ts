import z from "zod";
import { ZodValidationPipe } from "./zod-validation-pipe";

const pageQueryParamSchema = z.coerce.number().int().min(1).optional().default(1)

export const pageQueryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

export type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>
