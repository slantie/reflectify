import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.neon.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // This harmless fallback permits schema-only validation before the Neon
    // connection string is provided. Database commands still require DATABASE_URL.
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/reflectify",
  },
})
