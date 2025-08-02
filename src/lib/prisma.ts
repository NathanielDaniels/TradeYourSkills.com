import { PrismaClient } from "@prisma/client";

// Ensure a single PrismaClient instance across hot reloads (Next.js dev)
const globalForPrisma = globalThis as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = new PrismaClient());
