import { PrismaClient } from "@prisma/client";

// export type TransactionClient = Omit<
//   PrismaClient,
//   "$connect" | "$disconnect" | "$on" | "$transaction" | "$use"
// >;
export type TransactionClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];
