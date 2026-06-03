// Type partagé des variables d'environnement (bindings Cloudflare).
// Importé par chaque fichier de routes pour typer c.env.
export type Bindings = {
  DATABASE_URL: string;
  CORS_ORIGIN: string;
};