import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Crée une connexion Drizzle vers Neon à partir d'une URL.
// On passe l'URL en argument plutôt que de lire process.env ici,
// parce que sur Cloudflare Workers les variables d'env arrivent
// via le "binding" de la requête, pas via process.env.
export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

// Type pratique : le type de l'objet db, réutilisable ailleurs
// (dans les services, les tests…) sans le recréer à la main.
export type Db = ReturnType<typeof createDb>;