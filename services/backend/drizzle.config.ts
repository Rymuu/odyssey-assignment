import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // où se trouve ton schéma
  schema: "./src/db/schema.ts",
  // où drizzle-kit écrira les fichiers de migration SQL générés
  out: "./drizzle",
  // le dialecte de base de données
  dialect: "postgresql",
  // comment se connecter à la base (lit DATABASE_URL depuis .env)
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});