import path from "node:path";
import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

// Load environment variables from .env.local for Prisma CLI
dotenv.config({ path: path.join(__dirname, ".env.local") });

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
