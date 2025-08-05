import { PrismaClient } from "@prisma/client";

export type TransactionClient = Parameters<
  NonNullable<Parameters<PrismaClient["$transaction"]>[0]>
>[0];
