import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClient = new PrismaClient();
export const prisma = (global.prisma || prismaClient) as PrismaClient & {
  config: {
    upsert: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
  };
};

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
