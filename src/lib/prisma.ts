import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
  poolUrl: string | undefined;
};

const rawUrl = process.env.DATABASE_URL || "";
// Strip sslmode so pg doesn't force rejectUnauthorized: true
const cleanUrl = rawUrl.replace(/([?&])sslmode=[^&]+(&|$)/, "$1").replace(/[?&]$/, "");
const isLocalhost = cleanUrl.includes("localhost") || cleanUrl.includes("127.0.0.1");

if (!globalForPrisma.pool || globalForPrisma.poolUrl !== cleanUrl) {
  if (globalForPrisma.pool) {
    try { globalForPrisma.pool.end(); } catch (e) {}
  }
  globalForPrisma.pool = new Pool({
    connectionString: cleanUrl,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
  });
  globalForPrisma.poolUrl = cleanUrl;
  const adapter = new PrismaPg(globalForPrisma.pool);
  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: ["query", "info", "warn", "error"],
  });
}

export const prisma = globalForPrisma.prisma!;
